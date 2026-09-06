from rest_framework.generics import ListCreateAPIView
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsTutor
from students.models import StudentProfile

from .serializers import StudentSerializer


class StudentListPagination(PageNumberPagination):
    page_size = 25


class StudentListView(ListCreateAPIView):
    permission_classes = [IsTutor]
    serializer_class = StudentSerializer
    pagination_class = StudentListPagination
    queryset = StudentProfile.objects.all().order_by("last_name", "first_name", "pk")
