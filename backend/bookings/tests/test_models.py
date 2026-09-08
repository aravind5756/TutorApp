from datetime import datetime, timedelta, timezone

import pytest
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError

from bookings.models import Booking
from students.models import StudentProfile


pytestmark = pytest.mark.django_db

START = datetime(2026, 9, 8, 10, 0, tzinfo=timezone.utc)


@pytest.fixture
def student():
    return StudentProfile.objects.create(first_name="Maya", last_name="Thompson")


def create_booking(student, starts_at=START, ends_at=None, **values):
    return Booking.objects.create(
        student=student,
        starts_at=starts_at,
        ends_at=ends_at or starts_at + timedelta(hours=1),
        format=values.pop("format", Booking.Format.ONLINE),
        **values,
    )


def test_booking_stores_lesson_details_and_defaults(student):
    booking = create_booking(student, location="Video call")
    booking.refresh_from_db()

    assert booking.student == student
    assert booking.status == Booking.Status.REQUESTED
    assert booking.format == Booking.Format.ONLINE
    assert booking.location == "Video call"
    assert booking.created_at is not None
    assert booking.updated_at is not None
    assert str(booking) == "Maya Thompson - 08 Sep 2026 10:00"


@pytest.mark.parametrize("duration", [timedelta(0), timedelta(minutes=-1)])
def test_booking_must_end_after_it_starts(student, duration):
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            create_booking(student, ends_at=START + duration)

    assert not Booking.objects.exists()


def test_overlapping_non_cancelled_bookings_are_rejected(student):
    create_booking(student, status=Booking.Status.CONFIRMED)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            create_booking(
                student,
                starts_at=START + timedelta(minutes=30),
                ends_at=START + timedelta(hours=1, minutes=30),
            )

    assert Booking.objects.count() == 1


def test_adjacent_bookings_are_allowed(student):
    create_booking(student)

    second_booking = create_booking(
        student,
        starts_at=START + timedelta(hours=1),
        ends_at=START + timedelta(hours=2),
    )

    assert Booking.objects.count() == 2
    assert second_booking.starts_at == START + timedelta(hours=1)


def test_cancelled_booking_does_not_block_the_time_slot(student):
    create_booking(student, status=Booking.Status.CANCELLED)

    confirmed_booking = create_booking(student, status=Booking.Status.CONFIRMED)

    assert Booking.objects.count() == 2
    assert confirmed_booking.status == Booking.Status.CONFIRMED


def test_bookings_for_different_students_cannot_overlap():
    first_student = StudentProfile.objects.create(first_name="Maya", last_name="Thompson")
    second_student = StudentProfile.objects.create(first_name="Ethan", last_name="Williams")
    create_booking(first_student)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            create_booking(
                second_student,
                starts_at=START + timedelta(minutes=15),
                ends_at=START + timedelta(minutes=45),
            )

    assert Booking.objects.count() == 1


def test_student_with_booking_history_cannot_be_deleted(student):
    create_booking(student)

    with pytest.raises(ProtectedError):
        student.delete()

    assert StudentProfile.objects.filter(pk=student.pk).exists()
    assert Booking.objects.filter(student=student).exists()


def test_bookings_are_ordered_by_start_time(student):
    later_booking = create_booking(
        student,
        starts_at=START + timedelta(hours=2),
        ends_at=START + timedelta(hours=3),
    )
    earlier_booking = create_booking(student)

    assert list(Booking.objects.all()) == [earlier_booking, later_booking]
