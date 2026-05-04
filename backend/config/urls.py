from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


def healthcheck(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", healthcheck, name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.users.urls")),
    path("api/reality-checks/", include("apps.reality_checks.urls")),
    path("api/journal/", include("apps.journal.urls")),
    path("api/meditation/", include("apps.meditation.urls")),
    path("api/quests/", include("apps.quests.urls")),
    path("api/practice/", include("apps.practice.urls")),
    path("api/reminders/", include("apps.reminders.urls")),
    path("api/push/", include("apps.reminders.push_urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/internal/", include("apps.reminders.internal_urls")),
]
