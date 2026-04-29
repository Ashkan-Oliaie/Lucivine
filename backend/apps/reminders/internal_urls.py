from django.urls import path

from .views import FireDueRemindersView

urlpatterns = [
    path(
        "fire-due-reminders/",
        FireDueRemindersView.as_view(),
        name="fire-due-reminders",
    ),
]
