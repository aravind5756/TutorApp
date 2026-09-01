import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User


@pytest.fixture
def tutor(db):
    return User.objects.create_user(
        email="tutor@example.com",
        password="a-secure-test-password",
        first_name="Alex",
        last_name="Reed",
        role=User.Role.TUTOR,
    )


def client_with_csrf():
    client = APIClient(enforce_csrf_checks=True)
    response = client.get(reverse("api:auth-csrf"))
    token = response.cookies["csrftoken"].value
    return client, token


def test_csrf_endpoint_sets_cookie():
    client = APIClient(enforce_csrf_checks=True)

    response = client.get(reverse("api:auth-csrf"))

    assert response.status_code == 200
    assert response.json() == {"detail": "CSRF cookie set."}
    assert response.cookies["csrftoken"].value


def test_login_requires_csrf(tutor):
    client = APIClient(enforce_csrf_checks=True)

    response = client.post(
        reverse("api:auth-login"),
        {"email": tutor.email, "password": "a-secure-test-password"},
        format="json",
    )

    assert response.status_code == 403


def test_login_returns_user_and_creates_session(tutor):
    client, token = client_with_csrf()

    response = client.post(
        reverse("api:auth-login"),
        {"email": tutor.email, "password": "a-secure-test-password"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": tutor.id,
        "email": "tutor@example.com",
        "first_name": "Alex",
        "last_name": "Reed",
        "role": "tutor",
    }
    assert client.cookies["sessionid"].value

    current_user_response = client.get(reverse("api:auth-current-user"))
    assert current_user_response.status_code == 200
    assert current_user_response.json()["email"] == tutor.email


def test_login_rejects_invalid_credentials(tutor):
    client, token = client_with_csrf()

    response = client.post(
        reverse("api:auth-login"),
        {"email": tutor.email, "password": "incorrect-password"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid email or password."}


@pytest.mark.django_db
def test_current_user_requires_authentication():
    client = APIClient()

    response = client.get(reverse("api:auth-current-user"))

    assert response.status_code == 403


def test_logout_ends_session(tutor):
    client, token = client_with_csrf()
    client.post(
        reverse("api:auth-login"),
        {"email": tutor.email, "password": "a-secure-test-password"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )
    rotated_token = client.cookies["csrftoken"].value

    response = client.post(
        reverse("api:auth-logout"),
        format="json",
        HTTP_X_CSRFTOKEN=rotated_token,
    )

    assert response.status_code == 204
    assert client.get(reverse("api:auth-current-user")).status_code == 403
