from django.urls import path

from .views import (
    CompleteDayView,
    SetCurrentWeekView,
    UserProgressListView,
    WeeklyProgramListView,
)

urlpatterns = [
    path("program/", WeeklyProgramListView.as_view(), name="weekly-program"),
    path("progress/", UserProgressListView.as_view(), name="user-progress"),
    path(
        "progress/current-week/",
        SetCurrentWeekView.as_view(),
        name="set-current-week",
    ),
    path(
        "progress/<int:week_number>/complete-day/",
        CompleteDayView.as_view(),
        name="complete-day",
    ),
]
