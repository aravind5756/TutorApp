from datetime import datetime, timedelta, timezone

import pytest
from django.contrib import admin
from django.contrib.auth.models import Permission
from django.urls import reverse

from accounts.models import User
from bookings.models import Booking
from students.models import StudentProfile


pytestmark = pytest.mark.django_db

START = datetime(2026, 9, 8, 9, 0, tzinfo=timezone.utc)


@pytest.fixture
def student():
    return StudentProfile.objects.create(first_name="Maya", last_name="Thompson")


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


def booking_form_data(student, start_time="10:00:00", end_time="11:00:00"):
    return {
        "student": student.pk,
        "starts_at_0": "2026-09-08",
        "starts_at_1": start_time,
        "ends_at_0": "2026-09-08",
        "ends_at_1": end_time,
        "status": Booking.Status.REQUESTED,
        "format": Booking.Format.ONLINE,
        "location": "Video call",
    }


def test_tutor_superuser_can_add_and_edit_booking_in_admin(client, student):
    tutor = User.objects.create_superuser(email="tutor@example.com", password="test-password")
    client.force_login(tutor)
    data = booking_form_data(student)

    response = client.post(reverse("admin:bookings_booking_add"), data)

    assert response.status_code == 302
    booking = Booking.objects.get()
    data["status"] = Booking.Status.CONFIRMED
    response = client.post(reverse("admin:bookings_booking_change", args=[booking.pk]), data)
    booking.refresh_from_db()

    assert response.status_code == 302
    assert booking.status == Booking.Status.CONFIRMED


def test_tutor_can_search_and_filter_bookings(client, booking):
    tutor = User.objects.create_superuser(email="tutor@example.com", password="test-password")
    client.force_login(tutor)
    other_student = StudentProfile.objects.create(first_name="Ethan", last_name="Williams")
    Booking.objects.create(
        student=other_student,
        starts_at=START + timedelta(hours=2),
        ends_at=START + timedelta(hours=3),
        status=Booking.Status.REQUESTED,
        format=Booking.Format.IN_PERSON,
    )

    search_response = client.get(reverse("admin:bookings_booking_changelist"), {"q": "Maya"})
    filter_response = client.get(
        reverse("admin:bookings_booking_changelist"),
        {"status__exact": Booking.Status.CONFIRMED},
    )

    assert list(search_response.context["cl"].result_list) == [booking]
    assert list(filter_response.context["cl"].result_list) == [booking]


def test_admin_rejects_an_overlapping_booking(client, booking, student):
    tutor = User.objects.create_superuser(email="tutor@example.com", password="test-password")
    client.force_login(tutor)

    response = client.post(
        reverse("admin:bookings_booking_add"),
        booking_form_data(student, start_time="10:30:00", end_time="11:30:00"),
    )

    assert response.status_code == 200
    assert Booking.objects.count() == 1
    errors = response.context["adminform"].form.non_field_errors()
    assert "prevent_overlapping_active_bookings" in str(errors)


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_staff_with_booking_permissions_is_denied(client, rf, booking, role):
    user = User.objects.create_user(email=f"{role}@example.com", role=role, is_staff=True)
    user.user_permissions.set(Permission.objects.filter(content_type__app_label="bookings"))
    client.force_login(user)
    request = rf.get("/admin/")
    request.user = user
    model_admin = admin.site._registry[Booking]

    assert not model_admin.has_module_permission(request)
    assert not model_admin.has_view_permission(request, booking)
    assert not model_admin.has_add_permission(request)
    assert not model_admin.has_change_permission(request, booking)
    assert not model_admin.has_delete_permission(request, booking)
    for url in [
        reverse("admin:bookings_booking_changelist"),
        reverse("admin:bookings_booking_add"),
        reverse("admin:bookings_booking_change", args=[booking.pk]),
        reverse("admin:bookings_booking_delete", args=[booking.pk]),
    ]:
        assert client.get(url).status_code == 403


def test_tutor_staff_still_needs_booking_permissions(client):
    tutor = User.objects.create_user(email="tutor@example.com", role=User.Role.TUTOR, is_staff=True)
    client.force_login(tutor)

    response = client.get(reverse("admin:bookings_booking_changelist"))

    assert response.status_code == 403


def test_anonymous_user_is_redirected_to_admin_login(client, booking):
    response = client.get(reverse("admin:bookings_booking_change", args=[booking.pk]))

    assert response.status_code == 302
    assert response.url.startswith(reverse("admin:login"))
