from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="StudentProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=150)),
                ("last_name", models.CharField(max_length=150)),
                ("year_group", models.CharField(blank=True, max_length=50)),
                ("subjects", models.TextField(blank=True, help_text="Subjects currently being tutored.")),
                ("goals", models.TextField(blank=True)),
                ("learning_needs", models.TextField(blank=True, help_text="Private tutor information; not for student or guardian portals.")),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("last_name", "first_name", "pk")},
        ),
    ]
