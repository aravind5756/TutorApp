import pytest
from django.contrib import admin
from django.contrib.auth.models import Permission
from django.urls import reverse

from accounts.models import User
from students.models import StudentProfile


pytestmark = pytest.mark.django_db


@pytest.fixture
def student():
    return StudentProfile.objects.create(
        first_name="Maya", last_name="Thompson", learning_needs="Private learning notes",
    )


def test_tutor_superuser_can_add_and_edit_student_in_admin(client):
    tutor = User.objects.create_superuser(email="tutor@example.com", password="test-password")
    client.force_login(tutor)
    data = {"first_name": "Maya", "last_name": "Thompson", "is_active": "on"}

    response = client.post(reverse("admin:students_studentprofile_add"), data)

    assert response.status_code == 302
    student = StudentProfile.objects.get()
    data["year_group"] = "Year 11"
    response = client.post(reverse("admin:students_studentprofile_change", args=[student.pk]), data)
    student.refresh_from_db()

    assert response.status_code == 302
    assert student.year_group == "Year 11"
    response = client.get(reverse("admin:students_studentprofile_changelist"))
    assert response.status_code == 200
    assert b"Maya" in response.content


@pytest.mark.parametrize("role", [User.Role.STUDENT, User.Role.GUARDIAN])
def test_non_tutor_staff_with_model_permissions_cannot_access_students(client, rf, student, role):
    user = User.objects.create_user(email=f"{role}@example.com", role=role, is_staff=True)
    user.user_permissions.set(Permission.objects.filter(content_type__app_label="students"))
    client.force_login(user)
    request = rf.get("/admin/")
    request.user = user
    model_admin = admin.site._registry[StudentProfile]

    assert not model_admin.has_module_permission(request)
    assert not model_admin.has_view_permission(request, student)
    assert not model_admin.has_add_permission(request)
    assert not model_admin.has_change_permission(request, student)
    assert not model_admin.has_delete_permission(request, student)
    for url in [
        reverse("admin:students_studentprofile_changelist"),
        reverse("admin:students_studentprofile_add"),
        reverse("admin:students_studentprofile_change", args=[student.pk]),
        reverse("admin:students_studentprofile_delete", args=[student.pk]),
    ]:
        response = client.get(url)
        assert response.status_code == 403
        assert b"Private learning notes" not in response.content

    assert client.post(reverse("admin:students_studentprofile_add"), {
        "first_name": "Other", "last_name": "Student",
    }).status_code == 403
    assert client.post(reverse("admin:students_studentprofile_change", args=[student.pk]), {
        "first_name": "Changed", "last_name": "Student",
    }).status_code == 403
    assert client.post(reverse("admin:students_studentprofile_delete", args=[student.pk]), {
        "post": "yes",
    }).status_code == 403
    student.refresh_from_db()
    assert student.first_name == "Maya"
    assert StudentProfile.objects.count() == 1


def test_tutor_staff_still_needs_model_permissions(client):
    tutor = User.objects.create_user(email="tutor@example.com", role=User.Role.TUTOR, is_staff=True)
    client.force_login(tutor)

    assert client.get(reverse("admin:students_studentprofile_changelist")).status_code == 403


def test_anonymous_user_is_redirected_to_admin_login(client, student):
    response = client.get(reverse("admin:students_studentprofile_change", args=[student.pk]))

    assert response.status_code == 302
    assert response.url.startswith(reverse("admin:login"))
    assert b"Private learning notes" not in response.content
