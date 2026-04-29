from collections import Counter
from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DreamEntry
from .serializers import DreamEntrySerializer


class DreamEntryViewSet(viewsets.ModelViewSet):
    serializer_class = DreamEntrySerializer
    filterset_fields = ("is_lucid", "technique_used")
    search_fields = ("title", "content")
    ordering_fields = ("dream_date", "created_at", "vividness")

    def get_queryset(self):
        qs = DreamEntry.objects.filter(user=self.request.user)
        params = self.request.query_params
        if (frm := params.get("from")):
            qs = qs.filter(dream_date__gte=frm)
        if (to := params.get("to")):
            qs = qs.filter(dream_date__lte=to)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        cutoff = timezone.now().date() - timedelta(days=30)
        recent = qs.filter(dream_date__gte=cutoff)

        technique_breakdown = dict(
            Counter(qs.exclude(technique_used="").values_list("technique_used", flat=True))
        )

        heatmap = (
            qs.annotate(day=TruncDate("dream_date"))
            .values("day")
            .annotate(count=Count("id"), lucid=Count("id", filter=Q(is_lucid=True)))
            .order_by("day")
        )

        agg = qs.aggregate(
            total=Count("id"),
            lucid_total=Count("id", filter=Q(is_lucid=True)),
            wild_total=Count("id", filter=Q(is_lucid=True, technique_used="WILD")),
            avg_vividness=Avg("vividness"),
        )

        return Response(
            {
                "total": agg["total"] or 0,
                "lucid_total": agg["lucid_total"] or 0,
                "wild_total": agg["wild_total"] or 0,
                "avg_vividness": float(agg["avg_vividness"]) if agg["avg_vividness"] else None,
                "last_30_days_total": recent.count(),
                "last_30_days_lucid": recent.filter(is_lucid=True).count(),
                "by_technique": technique_breakdown,
                "calendar": [
                    {"date": h["day"], "count": h["count"], "lucid": h["lucid"]}
                    for h in heatmap
                ],
            }
        )
