from .base import *  # noqa: F401, F403
from .base import _normalize_origin, env  # underscore-prefixed names are skipped by `import *`

DEBUG = False

# Toggle off only when terminating HTTPS exclusively at an outer proxy without HTTPS to Django (avoid redirect loops).
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)

CSRF_TRUSTED_ORIGINS = [
    _normalize_origin(o)
    for o in env.list("CSRF_TRUSTED_ORIGINS", default=[])
    if _normalize_origin(o)
]
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"

EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
