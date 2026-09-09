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


class BookingCreateSerializer(serializers.ModelSerializer):
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
        starts_at = attrs["starts_at"]
        ends_at = attrs["ends_at"]
        status = attrs.get("status", Booking.Status.REQUESTED)

        if ends_at <= starts_at:
            raise serializers.ValidationError(
                {"ends_at": "The booking must end after it starts."}
            )

        if status != Booking.Status.CANCELLED and Booking.objects.filter(
            ~Q(status=Booking.Status.CANCELLED),
            starts_at__lt=ends_at,
            ends_at__gt=starts_at,
        ).exists():
            raise serializers.ValidationError(
                {"non_field_errors": ["This time overlaps an existing booking."]}
            )

        return attrs

    def create(self, validated_data):
        try:
            with transaction.atomic():
                return super().create(validated_data)
        except IntegrityError as error:
            cause = getattr(error, "__cause__", None)
            constraint = getattr(getattr(cause, "diag", None), "constraint_name", None)
            if constraint == "prevent_overlapping_active_bookings":
                raise serializers.ValidationError(
                    {"non_field_errors": ["This time overlaps an existing booking."]}
                ) from error
            raise

    def to_representation(self, instance):
        return BookingSerializer(instance, context=self.context).data
