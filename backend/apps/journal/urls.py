from rest_framework.routers import DefaultRouter

from .views import DreamEntryViewSet

router = DefaultRouter()
router.register("entries", DreamEntryViewSet, basename="dream-entry")

urlpatterns = router.urls
