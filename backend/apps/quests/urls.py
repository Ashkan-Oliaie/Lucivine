from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    QuestAttemptViewSet,
    QuestListView,
    QuestLogView,
    UserQuestViewSet,
)

router = DefaultRouter()
router.register("attempts", QuestAttemptViewSet, basename="quest-attempt")
router.register("tracking", UserQuestViewSet, basename="user-quest")

urlpatterns = [
    path("", QuestListView.as_view(), name="quest-list"),
    path("log/", QuestLogView.as_view(), name="quest-log"),
    *router.urls,
]
