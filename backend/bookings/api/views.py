from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsTutor
from bookings.models import Booking

from .serializers import BookingSerializer


class BookingListPagination(PageNumberPagination):
    page_size = 25


class BookingListView(ListAPIView):
    permission_classes = [IsTutor]
    serializer_class = BookingSerializer
    pagination_class = BookingListPagination
    queryset = Booking.objects.select_related("student").order_by("starts_at", "pk")
