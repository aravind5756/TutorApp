from django.urls import include, path

from .views import health_check


app_name = "api"

urlpatterns = [
    path("auth/", include("accounts.api.urls")),
    path("students/", include("students.api.urls")),
    path("health/", health_check, name="health-check"),
]
