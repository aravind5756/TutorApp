import django.contrib.postgres.constraints
import django.contrib.postgres.fields.ranges
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("students", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                ("status", models.CharField(choices=[("requested", "Requested"), ("confirmed", "Confirmed"), ("completed", "Completed"), ("cancelled", "Cancelled")], default="requested", max_length=16)),
                ("format", models.CharField(choices=[("online", "Online"), ("in_person", "In person")], max_length=16)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="students.studentprofile")),
            ],
            options={"ordering": ("starts_at", "pk")},
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=models.CheckConstraint(condition=models.Q(("ends_at__gt", models.F("starts_at"))), name="booking_ends_after_start"),
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=django.contrib.postgres.constraints.ExclusionConstraint(condition=models.Q(("status", "cancelled"), _negated=True), expressions=((models.Func(models.F("starts_at"), models.F("ends_at"), function="TSTZRANGE"), django.contrib.postgres.fields.ranges.RangeOperators.OVERLAPS),), name="prevent_overlapping_active_bookings"),
        ),
    ]
