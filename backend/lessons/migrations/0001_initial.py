import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("bookings", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Lesson",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("planned_content", models.TextField(blank=True)),
                (
                    "attendance",
                    models.CharField(
                        choices=[
                            ("not_recorded", "Not recorded"),
                            ("present", "Present"),
                            ("late", "Late"),
                            ("absent", "Absent"),
                        ],
                        default="not_recorded",
                        max_length=16,
                    ),
                ),
                ("private_notes", models.TextField(blank=True)),
                ("shared_summary", models.TextField(blank=True)),
                ("homework", models.TextField(blank=True)),
                ("next_steps", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "booking",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="lesson",
                        to="bookings.booking",
                    ),
                ),
            ],
        ),
    ]
