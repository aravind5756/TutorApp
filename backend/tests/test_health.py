from django.urls import reverse


def test_health_check_returns_ok(client):
    response = client.get(reverse("api:health-check"))

    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/json"
    assert response.json() == {"status": "ok"}


def test_health_check_rejects_unsupported_methods(client):
    response = client.post(reverse("api:health-check"))

    assert response.status_code == 405
    assert response.json()["detail"] == 'Method "POST" not allowed.'
