from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings


def test_api_requires_authenticated_sessions_by_default():
    assert api_settings.DEFAULT_AUTHENTICATION_CLASSES == [SessionAuthentication]
    assert api_settings.DEFAULT_PERMISSION_CLASSES == [IsAuthenticated]
