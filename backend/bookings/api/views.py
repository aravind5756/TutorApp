from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsTutor
from bookings.models import Booking

from .serializers import BookingSerializer, BookingWriteSerializer


class BookingListPagination(PageNumberPagination):
    page_size = 25


class BookingListView(ListCreateAPIView):
    permission_classes = [IsTutor]
    serializer_class = BookingSerializer
    pagination_class = BookingListPagination
    queryset = Booking.objects.select_related("student").order_by("starts_at", "pk")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BookingWriteSerializer
        return BookingSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        booking_status = self.request.query_params.get("status")

        if booking_status is None:
            return queryset

        if booking_status not in Booking.Status.values:
            raise ValidationError(
                {"status": ["Select a valid booking status."]}
            )

        return queryset.filter(status=booking_status)


class BookingDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsTutor]
    serializer_class = BookingSerializer
    queryset = Booking.objects.select_related("student")
    http_method_names = ["get", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return BookingWriteSerializer
        return BookingSerializer
