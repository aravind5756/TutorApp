from django.urls import path

from .views import csrf, current_user, login, logout


urlpatterns = [
    path("csrf/", csrf, name="auth-csrf"),
    path("login/", login, name="auth-login"),
    path("logout/", logout, name="auth-logout"),
    path("me/", current_user, name="auth-current-user"),
]
