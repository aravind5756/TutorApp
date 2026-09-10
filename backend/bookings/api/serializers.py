from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import serializers

from bookings.models import Booking
from students.models import StudentProfile


class BookingStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ("id", "first_name", "last_name", "year_group")
        read_only_fields = fields


class BookingSerializer(serializers.ModelSerializer):
    student = BookingStudentSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "student",
            "starts_at",
            "ends_at",
            "status",
            "format",
            "location",
        )
        read_only_fields = fields


class BookingWriteSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.filter(is_active=True),
    )

    class Meta:
        model = Booking
        fields = (
            "id",
            "student",
            "starts_at",
            "ends_at",
            "status",
            "format",
            "location",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        starts_at = attrs.get(
            "starts_at",
            self.instance.starts_at if self.instance else None,
        )
        ends_at = attrs.get(
            "ends_at",
            self.instance.ends_at if self.instance else None,
        )
        status = attrs.get(
            "status",
            self.instance.status if self.instance else Booking.Status.REQUESTED,
        )

        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError(
                {"ends_at": "The booking must end after it starts."}
            )

        if status != Booking.Status.CANCELLED and starts_at and ends_at:
            conflicting_bookings = Booking.objects.filter(
                ~Q(status=Booking.Status.CANCELLED),
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
            )
            if self.instance:
                conflicting_bookings = conflicting_bookings.exclude(pk=self.instance.pk)
            if conflicting_bookings.exists():
                raise serializers.ValidationError(
                    {"non_field_errors": ["This time overlaps an existing booking."]}
                )

        return attrs

    def _save_without_conflicts(self, operation):
        try:
            with transaction.atomic():
                return operation()
        except IntegrityError as error:
            cause = getattr(error, "__cause__", None)
            constraint = getattr(getattr(cause, "diag", None), "constraint_name", None)
            if constraint == "prevent_overlapping_active_bookings":
                raise serializers.ValidationError(
                    {"non_field_errors": ["This time overlaps an existing booking."]}
                ) from error
            raise

    def create(self, validated_data):
        return self._save_without_conflicts(
            lambda: serializers.ModelSerializer.create(self, validated_data)
        )

    def update(self, instance, validated_data):
        return self._save_without_conflicts(
            lambda: serializers.ModelSerializer.update(self, instance, validated_data)
        )

    def to_representation(self, instance):
        return BookingSerializer(instance, context=self.context).data
