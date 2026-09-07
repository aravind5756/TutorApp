import pytest
from django.urls import reverse
from django.utils.dateparse import parse_datetime
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


def test_tutor_can_create_a_student(tutor_client):
    response = tutor_client.post(reverse("api:student-list"), {
        "first_name": "  Maya  ", "last_name": "  Thompson  ",
        "year_group": "Year 11", "subjects": "Mathematics\nPhysics",
    }, format="json")

    assert response.status_code == 201
    student = StudentProfile.objects.get()
    assert student.first_name == "Maya"
    assert student.last_name == "Thompson"
    assert student.is_active
    assert response.json() == {
        "id": student.pk, "first_name": "Maya", "last_name": "Thompson",
        "year_group": "Year 11", "subjects": "Mathematics\nPhysics", "is_active": True,
    }


@pytest.mark.parametrize("missing_field", ["first_name", "last_name"])
def test_student_names_are_required_when_creating(tutor_client, missing_field):
    data = {"first_name": "Maya", "last_name": "Thompson"}
    del data[missing_field]

    response = tutor_client.post(reverse("api:student-list"), data, format="json")

    assert response.status_code == 400
    assert missing_field in response.json()
    assert not StudentProfile.objects.exists()


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_cannot_create_students(client, role):
    user = User.objects.create_user(email=f"{role}-create@example.com", role=role)
    client.force_login(user)

    response = client.post(reverse("api:student-list"), {
        "first_name": "Maya", "last_name": "Thompson",
    }, format="json")

    assert response.status_code == 403
    assert not StudentProfile.objects.exists()


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


@pytest.mark.parametrize("method", ["put", "patch", "delete"])
def test_list_endpoint_does_not_allow_writes(tutor_client, student, method):
    response = getattr(tutor_client, method)(
        reverse("api:student-list"), {"first_name": "Changed"}, format="json",
    )

    assert response.status_code == 405
    student.refresh_from_db()
    assert student.first_name == "Maya"
    assert StudentProfile.objects.count() == 1


def test_tutor_can_view_a_students_complete_record(tutor_client, student):
    student.is_active = False
    student.save()

    response = tutor_client.get(reverse("api:student-detail", args=[student.pk]))

    assert response.status_code == 200
    data = response.json()
    assert parse_datetime(data.pop("created_at")) == student.created_at
    assert parse_datetime(data.pop("updated_at")) == student.updated_at
    assert data == {
        "id": student.pk,
        "first_name": "Maya",
        "last_name": "Thompson",
        "year_group": "Year 11",
        "subjects": "Mathematics",
        "goals": "Private goal",
        "learning_needs": "Private needs",
        "is_active": False,
    }


def test_anonymous_user_cannot_view_student_details(client, student):
    response = client.get(reverse("api:student-detail", args=[student.pk]))

    assert response.status_code == 403
    assert b"Maya" not in response.content
    assert b"Private needs" not in response.content


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_cannot_view_student_details(client, student, role):
    user = User.objects.create_user(
        email=f"{role}-detail@example.com",
        role=role,
        is_staff=True,
        is_superuser=True,
    )
    client.force_login(user)

    response = client.get(reverse("api:student-detail", args=[student.pk]))

    assert response.status_code == 403
    assert b"Private goal" not in response.content
    assert b"Private needs" not in response.content


def test_missing_student_detail_returns_not_found(tutor_client):
    response = tutor_client.get(reverse("api:student-detail", args=[999999]))

    assert response.status_code == 404


@pytest.mark.parametrize("method", ["post", "put", "delete"])
def test_student_detail_endpoint_rejects_unsupported_write_methods(tutor_client, student, method):
    response = getattr(tutor_client, method)(
        reverse("api:student-detail", args=[student.pk]),
        {"first_name": "Changed"},
        format="json",
    )

    assert response.status_code == 405
    student.refresh_from_db()
    assert student.first_name == "Maya"


def test_tutor_can_update_a_students_complete_record(tutor_client, student):
    response = tutor_client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {
            "first_name": "  Maya-Rose  ",
            "last_name": "  Thompson-Smith  ",
            "year_group": "Year 12",
            "subjects": "Mathematics\nPhysics",
            "goals": "Prepare for A-level study",
            "learning_needs": "Use visual examples",
            "is_active": False,
        },
        format="json",
    )

    assert response.status_code == 200
    student.refresh_from_db()
    assert student.first_name == "Maya-Rose"
    assert student.last_name == "Thompson-Smith"
    assert student.year_group == "Year 12"
    assert student.subjects == "Mathematics\nPhysics"
    assert student.goals == "Prepare for A-level study"
    assert student.learning_needs == "Use visual examples"
    assert not student.is_active
    assert response.json()["learning_needs"] == "Use visual examples"


def test_student_update_only_changes_submitted_fields(tutor_client, student):
    response = tutor_client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {"goals": "Reach grade 8"},
        format="json",
    )

    assert response.status_code == 200
    student.refresh_from_db()
    assert student.goals == "Reach grade 8"
    assert student.first_name == "Maya"
    assert student.last_name == "Thompson"
    assert student.learning_needs == "Private needs"


@pytest.mark.parametrize("field", ["first_name", "last_name"])
def test_student_update_rejects_blank_names(tutor_client, student, field):
    response = tutor_client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {field: "   "},
        format="json",
    )

    assert response.status_code == 400
    assert field in response.json()
    student.refresh_from_db()
    assert student.first_name == "Maya"
    assert student.last_name == "Thompson"


def test_anonymous_user_cannot_update_student_details(client, student):
    response = client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {"goals": "Changed"},
        format="json",
    )

    assert response.status_code == 403
    student.refresh_from_db()
    assert student.goals == "Private goal"


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_cannot_update_student_details(client, student, role):
    user = User.objects.create_user(
        email=f"{role}-update@example.com",
        role=role,
        is_staff=True,
        is_superuser=True,
    )
    client.force_login(user)

    response = client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {"learning_needs": "Changed private notes"},
        format="json",
    )

    assert response.status_code == 403
    student.refresh_from_db()
    assert student.learning_needs == "Private needs"


def test_student_update_requires_csrf(student):
    client = APIClient(enforce_csrf_checks=True)
    tutor = User.objects.create_user(email="csrf-tutor@example.com", role=User.Role.TUTOR)
    client.force_login(tutor)

    response = client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {"goals": "Changed"},
        format="json",
    )

    assert response.status_code == 403
    student.refresh_from_db()
    assert student.goals == "Private goal"


def test_student_update_ignores_read_only_system_fields(tutor_client, student):
    original_created_at = student.created_at
    response = tutor_client.patch(
        reverse("api:student-detail", args=[student.pk]),
        {"id": 999999, "created_at": None, "updated_at": None},
        format="json",
    )

    assert response.status_code == 200
    student.refresh_from_db()
    assert student.pk != 999999
    assert student.created_at == original_created_at
    assert response.json()["id"] == student.pk


def test_updating_a_missing_student_returns_not_found(tutor_client):
    response = tutor_client.patch(
        reverse("api:student-detail", args=[999999]),
        {"goals": "Changed"},
        format="json",
    )

    assert response.status_code == 404
