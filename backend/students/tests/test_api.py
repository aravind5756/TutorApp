import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from students.models import StudentProfile


pytestmark = pytest.mark.django_db


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
        first_name="Maya", last_name="Thompson", year_group="Year 11",
        subjects="Mathematics", goals="Private goal", learning_needs="Private needs",
    )


def test_anonymous_user_cannot_list_students(client, student):
    response = client.get(reverse("api:student-list"))

    assert response.status_code == 403
    assert "results" not in response.json()
    assert b"Maya" not in response.content


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_cannot_list_students_even_with_admin_status(client, student, role):
    user = User.objects.create_user(
        email=f"{role}@example.com", role=role, is_staff=True, is_superuser=True,
    )
    client.force_login(user)

    response = client.get(reverse("api:student-list"))

    assert response.status_code == 403
    assert "results" not in response.json()
    assert b"Maya" not in response.content


def test_inactive_tutor_cannot_list_students(client, student):
    user = User.objects.create_user(
        email="inactive@example.com", role=User.Role.TUTOR, is_active=False,
    )
    client.force_authenticate(user=user)

    assert client.get(reverse("api:student-list")).status_code == 403


def test_tutor_without_admin_access_gets_only_list_fields(tutor_client, student):
    response = tutor_client.get(reverse("api:student-list"))

    assert response.status_code == 200
    assert response.json() == {
        "count": 1, "next": None, "previous": None,
        "results": [{
            "id": student.pk, "first_name": "Maya", "last_name": "Thompson",
            "year_group": "Year 11", "subjects": "Mathematics", "is_active": True,
        }],
    }


def test_empty_student_list(tutor_client):
    response = tutor_client.get(reverse("api:student-list"))

    assert response.status_code == 200
    assert response.json() == {"count": 0, "next": None, "previous": None, "results": []}


def test_list_includes_inactive_students_in_name_order(tutor_client, student):
    StudentProfile.objects.create(first_name="Zoe", last_name="Reed")
    StudentProfile.objects.create(first_name="Alex", last_name="Reed", is_active=False)

    response = tutor_client.get(reverse("api:student-list"))
    results = response.json()["results"]

    assert [record["first_name"] for record in results] == ["Alex", "Zoe", "Maya"]
    assert results[0]["is_active"] is False


def test_students_are_paginated_without_duplicates(tutor_client):
    StudentProfile.objects.bulk_create([
        StudentProfile(first_name="Alex", last_name="Reed") for _ in range(26)
    ])
    response = tutor_client.get(reverse("api:student-list"))
    first_page = response.json()
    second_page = tutor_client.get(first_page["next"]).json()

    assert first_page["count"] == 26
    assert len(first_page["results"]) == 25
    assert first_page["previous"] is None
    assert len(second_page["results"]) == 1
    assert second_page["next"] is None
    assert second_page["previous"] is not None
    ids = [record["id"] for record in first_page["results"] + second_page["results"]]
    assert ids == list(StudentProfile.objects.values_list("pk", flat=True))


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_list_endpoint_does_not_allow_writes(tutor_client, student, method):
    response = getattr(tutor_client, method)(
        reverse("api:student-list"), {"first_name": "Changed"}, format="json",
    )

    assert response.status_code == 405
    student.refresh_from_db()
    assert student.first_name == "Maya"
    assert StudentProfile.objects.count() == 1
