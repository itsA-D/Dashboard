from .base import *

DEBUG = True

# Use SQLite for local development if PostgreSQL is not available
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Disable S3 in development — local file storage
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# Relax CORS in development so forwarded/tunnel frontend URLs can call the API.
CORS_ALLOW_ALL_ORIGINS = True

# Disable Sentry in development
SENTRY_DSN = ""

# Development logging
LOGGING["loggers"]["zoop"]["level"] = "DEBUG"
