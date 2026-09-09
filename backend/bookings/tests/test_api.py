from datetime import datetime, timedelta, timezone

import pytest
from django.urls import reverse
from django.utils.dateparse import parse_datetime
from rest_framework.test import APIClient

from accounts.models import User
from bookings.models import Booking
from students.models import StudentProfile


pytestmark = pytest.mark.django_db

START = datetime(2026, 9, 8, 9, 0, tzinfo=timezone.utc)


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def tutor_client(client):
    tutor = User.objects.create_user(email="tutor@example.com", role=User.Role.TUTOR)
    client.force_login(tutor)
    return client


@pytest.fixture
def student():
    return StudentProfile.objects.create(
        first_name="Maya",
        last_name="Thompson",
        year_group="Year 11",
        learning_needs="Private student information",
    )


@pytest.fixture
def booking(student):
    return Booking.objects.create(
        student=student,
        starts_at=START,
        ends_at=START + timedelta(hours=1),
        status=Booking.Status.CONFIRMED,
        format=Booking.Format.ONLINE,
        location="Video call",
    )


def booking_payload(student, **changes):
    payload = {
        "student": student.pk,
        "starts_at": START.isoformat(),
        "ends_at": (START + timedelta(hours=1)).isoformat(),
        "format": Booking.Format.ONLINE,
        "location": "Video call",
    }
    payload.update(changes)
    return payload


def test_anonymous_user_cannot_list_bookings(client, booking):
    response = client.get(reverse("api:booking-list"))

    assert response.status_code == 403
    assert "results" not in response.json()
    assert b"Maya" not in response.content


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_cannot_list_bookings_even_with_admin_status(client, booking, role):
    user = User.objects.create_user(
        email=f"{role}@example.com",
        role=role,
        is_staff=True,
        is_superuser=True,
    )
    client.force_login(user)

    response = client.get(reverse("api:booking-list"))

    assert response.status_code == 403
    assert "results" not in response.json()
    assert b"Maya" not in response.content


def test_inactive_tutor_cannot_list_bookings(client, booking):
    tutor = User.objects.create_user(
        email="inactive@example.com",
        role=User.Role.TUTOR,
        is_active=False,
    )
    client.force_authenticate(user=tutor)

    assert client.get(reverse("api:booking-list")).status_code == 403


def test_tutor_without_admin_access_can_list_booking_details(tutor_client, booking):
    response = tutor_client.get(reverse("api:booking-list"))

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["next"] is None
    assert data["previous"] is None
    record = data["results"][0]
    assert parse_datetime(record.pop("starts_at")) == booking.starts_at
    assert parse_datetime(record.pop("ends_at")) == booking.ends_at
    assert record == {
        "id": booking.pk,
        "student": {
            "id": booking.student.pk,
            "first_name": "Maya",
            "last_name": "Thompson",
            "year_group": "Year 11",
        },
        "status": "confirmed",
        "format": "online",
        "location": "Video call",
    }
    assert "learning_needs" not in record["student"]


def test_empty_booking_list(tutor_client):
    response = tutor_client.get(reverse("api:booking-list"))

    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


def test_bookings_are_ordered_by_start_time(tutor_client, student):
    later = Booking.objects.create(
        student=student,
        starts_at=START + timedelta(hours=2),
        ends_at=START + timedelta(hours=3),
        format=Booking.Format.ONLINE,
    )
    earlier = Booking.objects.create(
        student=student,
        starts_at=START,
        ends_at=START + timedelta(hours=1),
        format=Booking.Format.IN_PERSON,
    )

    response = tutor_client.get(reverse("api:booking-list"))

    assert [record["id"] for record in response.json()["results"]] == [
        earlier.pk,
        later.pk,
    ]


def test_booking_list_returns_records_in_groups_of_twenty_five(tutor_client, student):
    Booking.objects.bulk_create([
        Booking(
            student=student,
            starts_at=START + timedelta(hours=index),
            ends_at=START + timedelta(hours=index + 1),
            format=Booking.Format.ONLINE,
        )
        for index in range(26)
    ])

    first_response = tutor_client.get(reverse("api:booking-list"))
    first_page = first_response.json()
    second_page = tutor_client.get(first_page["next"]).json()

    assert first_page["count"] == 26
    assert len(first_page["results"]) == 25
    assert first_page["previous"] is None
    assert len(second_page["results"]) == 1
    assert second_page["next"] is None
    assert second_page["previous"] is not None
    booking_ids = [record["id"] for record in first_page["results"] + second_page["results"]]
    assert booking_ids == list(Booking.objects.values_list("pk", flat=True))


def test_tutor_can_create_a_booking(tutor_client, student):
    response = tutor_client.post(
        reverse("api:booking-list"),
        booking_payload(student),
        format="json",
    )

    assert response.status_code == 201
    created = Booking.objects.get()
    data = response.json()
    assert data["id"] == created.pk
    assert data["student"] == {
        "id": student.pk,
        "first_name": "Maya",
        "last_name": "Thompson",
        "year_group": "Year 11",
    }
    assert parse_datetime(data["starts_at"]) == START
    assert parse_datetime(data["ends_at"]) == START + timedelta(hours=1)
    assert data["status"] == Booking.Status.REQUESTED
    assert data["format"] == Booking.Format.ONLINE
    assert data["location"] == "Video call"
    assert "learning_needs" not in data["student"]


def test_anonymous_user_cannot_create_a_booking(client, student):
    response = client.post(
        reverse("api:booking-list"),
        booking_payload(student),
        format="json",
    )

    assert response.status_code == 403
    assert Booking.objects.count() == 0


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_cannot_create_a_booking(client, student, role):
    user = User.objects.create_user(
        email=f"{role}@example.com",
        role=role,
        is_staff=True,
        is_superuser=True,
    )
    client.force_login(user)

    response = client.post(
        reverse("api:booking-list"),
        booking_payload(student),
        format="json",
    )

    assert response.status_code == 403
    assert Booking.objects.count() == 0


def test_booking_creation_requires_csrf(student):
    tutor = User.objects.create_user(
        email="tutor@example.com",
        role=User.Role.TUTOR,
    )
    client = APIClient(enforce_csrf_checks=True)
    client.force_login(tutor)

    response = client.post(
        reverse("api:booking-list"),
        booking_payload(student),
        format="json",
    )

    assert response.status_code == 403
    assert Booking.objects.count() == 0


def test_booking_must_end_after_it_starts(tutor_client, student):
    response = tutor_client.post(
        reverse("api:booking-list"),
        booking_payload(student, ends_at=START.isoformat()),
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["ends_at"] == ["The booking must end after it starts."]
    assert Booking.objects.count() == 0


def test_booking_cannot_be_created_for_an_inactive_student(tutor_client, student):
    student.is_active = False
    student.save()

    response = tutor_client.post(
        reverse("api:booking-list"),
        booking_payload(student),
        format="json",
    )

    assert response.status_code == 400
    assert "student" in response.json()
    assert Booking.objects.count() == 0


def test_booking_cannot_overlap_an_active_booking(tutor_client, student, booking):
    response = tutor_client.post(
        reverse("api:booking-list"),
        booking_payload(
            student,
            starts_at=(START + timedelta(minutes=30)).isoformat(),
            ends_at=(START + timedelta(hours=1, minutes=30)).isoformat(),
        ),
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["non_field_errors"] == [
        "This time overlaps an existing booking."
    ]
    assert Booking.objects.count() == 1


def test_booking_can_start_when_another_booking_ends(tutor_client, student, booking):
    response = tutor_client.post(
        reverse("api:booking-list"),
        booking_payload(
            student,
            starts_at=booking.ends_at.isoformat(),
            ends_at=(booking.ends_at + timedelta(hours=1)).isoformat(),
        ),
        format="json",
    )

    assert response.status_code == 201
    assert Booking.objects.count() == 2


def test_cancelled_booking_does_not_block_its_time(tutor_client, student, booking):
    booking.status = Booking.Status.CANCELLED
    booking.save()

    response = tutor_client.post(
        reverse("api:booking-list"),
        booking_payload(student),
        format="json",
    )

    assert response.status_code == 201
    assert Booking.objects.count() == 2


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_booking_list_does_not_allow_writes(tutor_client, booking, method):
    response = getattr(tutor_client, method)(
        reverse("api:booking-list"),
        {"status": Booking.Status.CANCELLED},
        format="json",
    )

    assert response.status_code == 405
    booking.refresh_from_db()
    assert booking.status == Booking.Status.CONFIRMED
