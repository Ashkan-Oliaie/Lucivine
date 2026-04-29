from collections import Counter
from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import RealityCheck
from .serializers import RealityCheckSerializer


class RealityCheckViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = RealityCheckSerializer
    filterset_fields = ("method", "was_lucid_trigger")
    ordering_fields = ("performed_at",)

    def get_queryset(self):
        qs = RealityCheck.objects.filter(user=self.request.user)
        params = self.request.query_params
        if (frm := params.get("from")):
            qs = qs.filter(performed_at__gte=frm)
        if (to := params.get("to")):
            qs = qs.filter(performed_at__lte=to)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        cutoff = timezone.now() - timedelta(days=30)
        recent = qs.filter(performed_at__gte=cutoff)

        daily = (
            recent.annotate(day=TruncDate("performed_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        method_counts = dict(Counter(qs.values_list("method", flat=True)))

        return Response(
            {
                "total": qs.count(),
                "last_30_days_total": recent.count(),
                "daily": [{"date": d["day"], "count": d["count"]} for d in daily],
                "by_method": method_counts,
            }
        )
