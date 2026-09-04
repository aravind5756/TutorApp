from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsTutor
from students.models import StudentProfile

from .serializers import StudentListSerializer


class StudentListPagination(PageNumberPagination):
    page_size = 25


class StudentListView(ListAPIView):
    permission_classes = [IsTutor]
    serializer_class = StudentListSerializer
    pagination_class = StudentListPagination
    queryset = StudentProfile.objects.all().order_by("last_name", "first_name", "pk")
