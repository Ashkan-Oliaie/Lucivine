from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()

SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "anymail",
    # local
    "apps.users",
    "apps.reality_checks",
    "apps.journal",
    "apps.meditation",
    "apps.spells",
    "apps.quests",
    "apps.practice",
    "apps.reminders",
    "apps.analytics",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", default="lucivine"),
        "USER": env("POSTGRES_USER", default="lucivine"),
        "PASSWORD": env("POSTGRES_PASSWORD", default=""),
        "HOST": env("POSTGRES_HOST", default="db"),
        "PORT": env("POSTGRES_PORT", default="5432"),
    }
}

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.users.exceptions.envelope_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_LIFETIME_MINUTES", default=30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_LIFETIME_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Lucivine API",
    "DESCRIPTION": "Backend API for the Lucivine lucid dreaming platform.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Internal scheduler (Cloud Scheduler hits the reminder fire endpoint with this secret)
_scheduler_secret_raw = env("INTERNAL_SCHEDULER_SECRET", default="dev-scheduler-secret") or ""
INTERNAL_SCHEDULER_SECRET = _scheduler_secret_raw.strip() or "dev-scheduler-secret"

# Email verification — for now everyone gets the same default code. Swap to per-user
# stored hashes when we wire real email sending.
DEFAULT_EMAIL_VERIFICATION_CODE = env("DEFAULT_EMAIL_VERIFICATION_CODE", default="111111")

# Email
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@lucivine.app")
ANYMAIL = {"SENDGRID_API_KEY": env("SENDGRID_API_KEY", default="")}

def _normalize_origin(url: str) -> str:
    """CORS / trusted-origin URLs must not end with '/' — django-cors-headers treats it as an invalid path."""
    url = str(url).strip()
    while url.endswith("/"):
        url = url[:-1]
    return url


FRONTEND_URL = _normalize_origin(env("FRONTEND_URL", default="http://localhost:5173"))

# Avoid HTTP 400 DisallowedHost when FRONTEND_URL’s hostname differs from DJANGO_ALLOWED_HOSTS (Traefik previews).
_fu_host = urlparse(FRONTEND_URL).hostname
if _fu_host and _fu_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_fu_host)

# Web Push (VAPID).
# If VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are unset, `apps.reminders.vapid`
# generates a keypair on first use and persists it under BASE_DIR/.vapid.json
# (fine for Docker dev with a mounted backend volume). For production, set both
# env vars explicitly so keys survive ephemeral disks.
# Optional override: `make vapid` / `npx web-push generate-vapid-keys`.
VAPID_PUBLIC_KEY = env("VAPID_PUBLIC_KEY", default="")
VAPID_PRIVATE_KEY = env("VAPID_PRIVATE_KEY", default="")
VAPID_CLAIMS_EMAIL = env("VAPID_CLAIMS_EMAIL", default="admin@lucivine.app")

# CORS — strip trailing slashes from env (common mistake when copying URLs).
CORS_ALLOWED_ORIGINS = [
    _normalize_origin(o)
    for o in env.list("CORS_ALLOWED_ORIGINS", default=[FRONTEND_URL])
    if _normalize_origin(o)
]
CORS_ALLOW_CREDENTIALS = True

# Logging — structured JSON for prod, human-readable in dev (overridden in dev.py)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}
