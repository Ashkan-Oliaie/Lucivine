from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PushSubscriptionViewSet, VapidPublicKeyView

router = DefaultRouter()
router.register("subscriptions", PushSubscriptionViewSet, basename="push-subscription")

urlpatterns = [
    path("vapid-public-key/", VapidPublicKeyView.as_view(), name="vapid-public-key"),
    *router.urls,
]
