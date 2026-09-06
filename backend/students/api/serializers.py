from rest_framework import serializers

from students.models import StudentProfile


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = (
            "id", "first_name", "last_name", "year_group", "subjects", "is_active",
        )
        read_only_fields = ("id", "is_active")
