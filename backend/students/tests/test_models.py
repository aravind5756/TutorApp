import pytest
from django.core.exceptions import ValidationError

from accounts.models import User
from students.models import StudentProfile


pytestmark = pytest.mark.django_db


def test_student_can_be_created_without_a_login_account():
    student = StudentProfile(first_name="Maya", last_name="Thompson")
    student.full_clean()
    student.save()
    student.refresh_from_db()

    assert str(student) == "Maya Thompson"
    assert student.is_active
    assert student.subjects == ""
    assert student.created_at is not None
    assert student.updated_at is not None
    assert not User.objects.exists()


@pytest.mark.parametrize("field", ["first_name", "last_name"])
def test_student_names_are_required_by_model_validation(field):
    student = StudentProfile(first_name="Maya", last_name="Thompson")
    setattr(student, field, "")

    with pytest.raises(ValidationError) as error:
        student.full_clean()

    assert field in error.value.message_dict


def test_student_tutoring_details_are_saved():
    student = StudentProfile.objects.create(
        first_name="Maya", last_name="Thompson", year_group="Year 11",
        subjects="Mathematics\nPhysics", goals="Build confidence in algebra",
        learning_needs="Use larger print worksheets",
    )
    student.refresh_from_db()

    assert student.year_group == "Year 11"
    assert student.subjects == "Mathematics\nPhysics"
    assert student.goals == "Build confidence in algebra"
    assert student.learning_needs == "Use larger print worksheets"


def test_student_can_be_archived_without_deleting_the_record():
    student = StudentProfile.objects.create(first_name="Maya", last_name="Thompson")
    original_created_at = student.created_at
    student.is_active = False
    student.save()
    student.refresh_from_db()

    assert not student.is_active
    assert student.created_at == original_created_at
    assert student.updated_at >= original_created_at
    assert StudentProfile.objects.filter(pk=student.pk).exists()


def test_students_are_ordered_by_last_name_then_first_name():
    for first_name, last_name in [("Zoe", "Reed"), ("Maya", "Thompson"), ("Alex", "Reed")]:
        StudentProfile.objects.create(first_name=first_name, last_name=last_name)

    assert list(StudentProfile.objects.values_list("first_name", flat=True)) == [
        "Alex", "Zoe", "Maya",
    ]
