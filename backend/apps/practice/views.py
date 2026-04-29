from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProgress, WeeklyProgram
from .serializers import (
    CompleteDaySerializer,
    SetCurrentWeekSerializer,
    UserProgressSerializer,
    WeeklyProgramSerializer,
)


class WeeklyProgramListView(generics.ListAPIView):
    """Read-only catalog of the 6-week curriculum."""

    permission_classes = (AllowAny,)
    serializer_class = WeeklyProgramSerializer
    queryset = WeeklyProgram.objects.all()
    pagination_class = None


class UserProgressListView(generics.ListAPIView):
    serializer_class = UserProgressSerializer
    pagination_class = None

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)


class CompleteDayView(APIView):
    """POST /api/practice/progress/{week}/complete-day/

    Body: { "date": "YYYY-MM-DD", "practices": ["morning_recall", ...] }

    Idempotent — completing the same practices on the same date is a no-op.
    """

    def post(self, request, week_number: int):
        get_object_or_404(WeeklyProgram, week_number=week_number)
        serializer = CompleteDaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        progress, _ = UserProgress.objects.get_or_create(
            user=request.user, week_number=week_number
        )
        date_key = serializer.validated_data["date"].isoformat()
        existing = set(progress.daily_completion_log.get(date_key, []))
        merged = sorted(existing | set(serializer.validated_data["practices"]))
        progress.daily_completion_log[date_key] = merged
        progress.save(update_fields=["daily_completion_log"])
        return Response(UserProgressSerializer(progress).data)


class SetCurrentWeekView(APIView):
    """PATCH /api/practice/progress/current-week/ — switch the user's active week."""

    def patch(self, request):
        serializer = SetCurrentWeekSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        week = serializer.validated_data["week_number"]
        get_object_or_404(WeeklyProgram, week_number=week)

        request.user.current_week = week
        request.user.save(update_fields=["current_week"])

        UserProgress.objects.get_or_create(user=request.user, week_number=week)

        return Response({"current_week": week}, status=status.HTTP_200_OK)
