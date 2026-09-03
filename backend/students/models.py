from django.db import models


class StudentProfile(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    year_group = models.CharField(max_length=50, blank=True)
    subjects = models.TextField(blank=True, help_text="Subjects currently being tutored.")
    goals = models.TextField(blank=True)
    learning_needs = models.TextField(
        blank=True, help_text="Private tutor information; not for student or guardian portals."
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("last_name", "first_name", "pk")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
