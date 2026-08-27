import pytest
from django.contrib.auth import get_user_model


User = get_user_model()


@pytest.mark.django_db
def test_create_user_uses_email_as_identity():
    user = User.objects.create_user(
        email="Learner@EXAMPLE.COM",
        password="a-secure-test-password",
        role=User.Role.STUDENT,
    )

    assert user.email == "Learner@example.com"
    assert user.role == User.Role.STUDENT
    assert user.check_password("a-secure-test-password")
    assert user.username is None


@pytest.mark.django_db
def test_create_user_requires_email():
    with pytest.raises(ValueError, match="email address"):
        User.objects.create_user(email="", password="a-secure-test-password")


@pytest.mark.django_db
def test_create_superuser_is_a_tutor_with_admin_access():
    user = User.objects.create_superuser(
        email="tutor@example.com",
        password="a-secure-test-password",
    )

    assert user.role == User.Role.TUTOR
    assert user.is_active
    assert user.is_staff
    assert user.is_superuser

