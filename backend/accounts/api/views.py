from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import CurrentUserSerializer, LoginSerializer


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    get_token(request)
    return Response({"detail": "CSRF cookie set."})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    SessionAuthentication().enforce_csrf(request._request)

    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = authenticate(
        request=request._request,
        username=serializer.validated_data["email"],
        password=serializer.validated_data["password"],
    )

    if user is None:
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    django_login(request._request, user)
    return Response(CurrentUserSerializer(user).data)


@api_view(["POST"])
def logout(request):
    django_logout(request._request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def current_user(request):
    return Response(CurrentUserSerializer(request.user).data)
