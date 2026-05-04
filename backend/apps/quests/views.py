from collections import defaultdict

from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quest, QuestAttempt, UserQuest
from .serializers import (
    QuestAttemptSerializer,
    QuestSerializer,
    UserQuestSerializer,
)


def _lucid_count(user) -> int:
    return user.dream_entries.filter(is_lucid=True).count()


def _week_match(week: int) -> Q:
    """Quests whose `weeks` list is empty (= every week) OR contains `week`."""
    return Q(weeks__len=0) | Q(weeks__contains=[week])


def _quest_context(request) -> dict:
    """Shared context for QuestSerializer — user-scoped tracking + condition data."""
    user = request.user
    uqs = list(UserQuest.objects.filter(user=user))
    user_quest_by_id = {uq.quest_id: uq for uq in uqs}
    completed_quest_ids = {uq.quest_id for uq in uqs if uq.completed_at is not None}

    prereq_index: dict = defaultdict(list)
    for quest_id, prereq_id in Quest.prerequisites.through.objects.values_list(
        "from_quest_id", "to_quest_id"
    ):
        prereq_index[quest_id].append(prereq_id)

    return {
        "lucid_count": _lucid_count(user),
        "current_week": getattr(user, "current_week", 1) or 1,
        "user_quest_by_id": user_quest_by_id,
        "completed_quest_ids": completed_quest_ids,
        "prereq_index": prereq_index,
    }


class QuestListView(generics.ListAPIView):
    """All active quests, with per-user unlock + tracking annotations.

    Optional ?week=N filter narrows to quests available in a given week
    (matches when `weeks` is empty or contains N).
    """

    serializer_class = QuestSerializer

    def get_queryset(self):
        qs = Quest.objects.filter(is_active=True).prefetch_related("prerequisites")
        week = self.request.query_params.get("week")
        if week and week.isdigit():
            w = int(week)
            qs = qs.filter(_week_match(w))
        return qs

    def list(self, request, *args, **kwargs):
        quests = list(self.get_queryset())
        attempt_counts = dict(
            QuestAttempt.objects.filter(user=request.user)
            .values_list("quest_id")
            .annotate(c=Count("id"))
            .values_list("quest_id", "c")
        )
        for q in quests:
            q.attempt_count = attempt_counts.get(q.id, 0)
        ctx = {**self.get_serializer_context(), **_quest_context(request)}
        ser = QuestSerializer(quests, many=True, context=ctx)
        return Response(
            {
                "lucid_count": ctx["lucid_count"],
                "current_week": ctx["current_week"],
                "results": ser.data,
            }
        )


class UserQuestViewSet(viewsets.ModelViewSet):
    """Manage which quests the seeker is tracking.

    POST /tracking/  { quest: <id> }    → start tracking
    PATCH /tracking/<id>/ { is_tracked, progress, completed }
    DELETE /tracking/<id>/              → stop tracking
    """

    serializer_class = UserQuestSerializer
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self):
        return UserQuest.objects.filter(user=self.request.user).select_related("quest")

    def perform_create(self, serializer):
        # Idempotent: if already tracking, just toggle is_tracked back on.
        quest = serializer.validated_data["quest"]
        uq, created = UserQuest.objects.get_or_create(
            user=self.request.user,
            quest=quest,
            defaults={"is_tracked": True},
        )
        if not created and not uq.is_tracked:
            uq.is_tracked = True
            uq.save(update_fields=["is_tracked"])
        serializer.instance = uq

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        uq = self.get_object()
        uq.completed_at = timezone.now()
        uq.progress = 100
        uq.save(update_fields=["completed_at", "progress"])
        return Response(self.get_serializer(uq).data)


class QuestAttemptViewSet(viewsets.ModelViewSet):
    serializer_class = QuestAttemptSerializer
    http_method_names = ("get", "post", "delete", "head", "options")

    def get_queryset(self):
        return QuestAttempt.objects.filter(user=self.request.user).select_related("quest")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class QuestLogView(APIView):
    """User's quest attempt history grouped by quest. (Replaces grimoire.)"""

    def get(self, request):
        attempts = (
            QuestAttempt.objects.filter(user=request.user)
            .select_related("quest")
            .order_by("-attempted_at")
        )
        ctx = _quest_context(request)
        grouped: dict = defaultdict(
            lambda: {"quest": None, "attempts": [], "avg_success": None}
        )
        for at in attempts:
            slot = grouped[at.quest.slug]
            if slot["quest"] is None:
                slot["quest"] = QuestSerializer(at.quest, context=ctx).data
            slot["attempts"].append(
                {
                    "id": str(at.id),
                    "dream_entry": str(at.dream_entry_id) if at.dream_entry_id else None,
                    "success_rating": at.success_rating,
                    "notes": at.notes,
                    "attempted_at": at.attempted_at,
                }
            )

        averages = (
            QuestAttempt.objects.filter(user=request.user)
            .values("quest__slug")
            .annotate(avg=Avg("success_rating"))
        )
        for row in averages:
            grouped[row["quest__slug"]]["avg_success"] = (
                float(row["avg"]) if row["avg"] is not None else None
            )

        return Response(list(grouped.values()))
