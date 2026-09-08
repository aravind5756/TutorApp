from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.db import models
from django.db.models import F, Q


class Booking(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Format(models.TextChoices):
        ONLINE = "online", "Online"
        IN_PERSON = "in_person", "In person"

    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.PROTECT,
        related_name="bookings",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.REQUESTED,
    )
    format = models.CharField(max_length=16, choices=Format.choices)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("starts_at", "pk")
        constraints = (
            models.CheckConstraint(
                condition=Q(ends_at__gt=F("starts_at")),
                name="booking_ends_after_start",
            ),
            ExclusionConstraint(
                name="prevent_overlapping_active_bookings",
                expressions=(
                    (
                        models.Func(
                            F("starts_at"),
                            F("ends_at"),
                            function="TSTZRANGE",
                        ),
                        RangeOperators.OVERLAPS,
                    ),
                ),
                condition=~Q(status="cancelled"),
            ),
        )

    def __str__(self):
        return f"{self.student} - {self.starts_at:%d %b %Y %H:%M}"
