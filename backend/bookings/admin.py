from django.contrib import admin

from accounts.models import User

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "starts_at",
        "ends_at",
        "status",
        "format",
    )
    list_filter = ("status", "format", "starts_at")
    search_fields = ("student__first_name", "student__last_name", "location")
    autocomplete_fields = ("student",)
    date_hierarchy = "starts_at"
    list_select_related = ("student",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Student", {"fields": ("student",)}),
        ("Schedule", {"fields": ("starts_at", "ends_at", "format", "location")}),
        ("Booking status", {"fields": ("status",)}),
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
