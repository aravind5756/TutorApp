from rest_framework.generics import ListCreateAPIView
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsTutor
from bookings.models import Booking

from .serializers import BookingCreateSerializer, BookingSerializer


class BookingListPagination(PageNumberPagination):
    page_size = 25


class BookingListView(ListCreateAPIView):
    permission_classes = [IsTutor]
    serializer_class = BookingSerializer
    pagination_class = BookingListPagination
    queryset = Booking.objects.select_related("student").order_by("starts_at", "pk")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BookingCreateSerializer
        return BookingSerializer
