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
