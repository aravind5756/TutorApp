def test_default_database_is_postgresql(settings):
    assert settings.DATABASES["default"]["ENGINE"] == (
        "django.db.backends.postgresql"
    )
