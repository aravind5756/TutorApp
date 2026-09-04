from rest_framework import serializers

from students.models import StudentProfile


class StudentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = (
            "id", "first_name", "last_name", "year_group", "subjects", "is_active",
        )
        read_only_fields = fields
