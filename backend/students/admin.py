from django.contrib import admin

from accounts.models import User

from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "year_group", "is_active")
    list_filter = ("is_active", "year_group")
    search_fields = ("first_name", "last_name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Student details", {"fields": ("first_name", "last_name", "year_group", "is_active")}),
        ("Tutoring", {"fields": ("subjects", "goals")}),
        ("Private tutor information", {"fields": ("learning_needs",)}),
        ("Record history", {"fields": ("created_at", "updated_at")}),
    )

    def _is_tutor(self, request):
        return (
            request.user.is_active
            and request.user.is_staff
            and getattr(request.user, "role", None) == User.Role.TUTOR
        )

    # Require the tutor role in addition to Django's usual model permissions.
    def has_module_permission(self, request):
        return self._is_tutor(request) and super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        return self._is_tutor(request) and super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        return self._is_tutor(request) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return self._is_tutor(request) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return self._is_tutor(request) and super().has_delete_permission(request, obj)
