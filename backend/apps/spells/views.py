from collections import defaultdict

from django.db.models import Avg, Count
from rest_framework import generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Spell, SpellCast
from .serializers import SpellCastSerializer, SpellSerializer


def _lucid_count(user) -> int:
    return user.dream_entries.filter(is_lucid=True).count()


class SpellListView(generics.ListAPIView):
    serializer_class = SpellSerializer

    def get_queryset(self):
        # annotate per-user cast counts
        return Spell.objects.all()

    def list(self, request, *args, **kwargs):
        spells = list(self.get_queryset())
        cast_counts = dict(
            SpellCast.objects.filter(user=request.user)
            .values_list("spell_id")
            .annotate(c=Count("id"))
            .values_list("spell_id", "c")
        )
        for s in spells:
            s.cast_count = cast_counts.get(s.id, 0)
        ctx = {**self.get_serializer_context(), "lucid_count": _lucid_count(request.user)}
        ser = SpellSerializer(spells, many=True, context=ctx)
        return Response({"lucid_count": ctx["lucid_count"], "results": ser.data})


class SpellCastViewSet(viewsets.ModelViewSet):
    serializer_class = SpellCastSerializer
    http_method_names = ("get", "post", "delete", "head", "options")

    def get_queryset(self):
        return SpellCast.objects.filter(user=self.request.user).select_related("spell")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GrimoireView(APIView):
    """User's casting history grouped by spell."""

    def get(self, request):
        casts = (
            SpellCast.objects.filter(user=request.user)
            .select_related("spell")
            .order_by("-cast_at")
        )
        grouped: dict[str, dict] = defaultdict(
            lambda: {"spell": None, "casts": [], "avg_success": None}
        )
        for cast in casts:
            slot = grouped[cast.spell.slug]
            if slot["spell"] is None:
                slot["spell"] = SpellSerializer(
                    cast.spell, context={"lucid_count": _lucid_count(request.user)}
                ).data
            slot["casts"].append(
                {
                    "id": str(cast.id),
                    "dream_entry": str(cast.dream_entry_id) if cast.dream_entry_id else None,
                    "success_rating": cast.success_rating,
                    "notes": cast.notes,
                    "cast_at": cast.cast_at,
                }
            )

        averages = (
            SpellCast.objects.filter(user=request.user)
            .values("spell__slug")
            .annotate(avg=Avg("success_rating"))
        )
        for row in averages:
            grouped[row["spell__slug"]]["avg_success"] = (
                float(row["avg"]) if row["avg"] is not None else None
            )

        return Response(list(grouped.values()))
