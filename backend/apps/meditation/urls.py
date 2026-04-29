from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ChakraCatalogView, ChakraSessionViewSet

router = DefaultRouter()
router.register("sessions", ChakraSessionViewSet, basename="chakra-session")

urlpatterns = [
    path("chakras/", ChakraCatalogView.as_view(), name="chakra-catalog"),
    *router.urls,
]
