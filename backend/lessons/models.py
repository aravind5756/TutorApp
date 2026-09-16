from django.db import models


class Lesson(models.Model):
    class Attendance(models.TextChoices):
        NOT_RECORDED = "not_recorded", "Not recorded"
        PRESENT = "present", "Present"
        LATE = "late", "Late"
        ABSENT = "absent", "Absent"

    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.PROTECT,
        related_name="lesson",
    )
    planned_content = models.TextField(blank=True)
    attendance = models.CharField(
        max_length=16,
        choices=Attendance.choices,
        default=Attendance.NOT_RECORDED,
    )
    private_notes = models.TextField(blank=True)
    shared_summary = models.TextField(blank=True)
    homework = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lesson for {self.booking.student} on {self.booking.starts_at:%d %b %Y}"
