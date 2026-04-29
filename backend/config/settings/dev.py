from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

LOGGING["handlers"]["console"]["formatter"] = "verbose"  # type: ignore[index]  # noqa: F405
LOGGING["formatters"]["verbose"] = {  # type: ignore[index]  # noqa: F405
    "format": "{levelname} {asctime} {name} {message}",
    "style": "{",
}

CORS_ALLOW_ALL_ORIGINS = True
