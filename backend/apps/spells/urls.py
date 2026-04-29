from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import GrimoireView, SpellCastViewSet, SpellListView

router = DefaultRouter()
router.register("cast", SpellCastViewSet, basename="spell-cast")

urlpatterns = [
    path("", SpellListView.as_view(), name="spell-list"),
    path("grimoire/", GrimoireView.as_view(), name="grimoire"),
    *router.urls,
]
