from collections import defaultdict
from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .catalog import CHAKRAS
from .models import ChakraSession
from .serializers import ChakraSessionSerializer


class ChakraCatalogView(APIView):
    """Static catalog of the seven chakras. Read-only, no auth required."""

    permission_classes = (AllowAny,)

    def get(self, _request):
        return Response(CHAKRAS)


class ChakraSessionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ChakraSessionSerializer
    filterset_fields = ("chakra_id",)
    ordering_fields = ("completed_at", "duration_seconds")

    def get_queryset(self):
        qs = ChakraSession.objects.filter(user=self.request.user)
        params = self.request.query_params
        if (chakra := params.get("chakra")):
            qs = qs.filter(chakra_id=chakra)
        if (frm := params.get("from")):
            qs = qs.filter(completed_at__gte=frm)
        if (to := params.get("to")):
            qs = qs.filter(completed_at__lte=to)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        per_chakra = (
            qs.values("chakra_id")
            .annotate(sessions=Count("id"), seconds=Sum("duration_seconds"))
            .order_by("chakra_id")
        )

        cutoff = timezone.now() - timedelta(days=30)
        timeseries = (
            qs.filter(completed_at__gte=cutoff)
            .annotate(day=TruncDate("completed_at"))
            .values("day", "chakra_id")
            .annotate(seconds=Sum("duration_seconds"))
            .order_by("day")
        )
        by_day: dict[str, dict[str, int]] = defaultdict(dict)
        for row in timeseries:
            by_day[str(row["day"])][row["chakra_id"]] = row["seconds"] or 0

        agg = qs.aggregate(total_sessions=Count("id"), total_seconds=Sum("duration_seconds"))

        return Response(
            {
                "total_sessions": agg["total_sessions"] or 0,
                "total_seconds": agg["total_seconds"] or 0,
                "per_chakra": [
                    {
                        "chakra_id": p["chakra_id"],
                        "sessions": p["sessions"],
                        "seconds": p["seconds"] or 0,
                    }
                    for p in per_chakra
                ],
                "last_30_days": [
                    {"date": day, "by_chakra": data} for day, data in sorted(by_day.items())
                ],
            }
        )
