from rest_framework.routers import DefaultRouter

from .views import RealityCheckViewSet

router = DefaultRouter()
router.register("", RealityCheckViewSet, basename="reality-check")

urlpatterns = router.urls
