from rest_framework.permissions import BasePermission

from .models import User


class IsTutor(BasePermission):
    message = "Only tutors can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role == User.Role.TUTOR
        )
