from datetime import datetime

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services


class DashboardView(APIView):
    def get(self, request):
        return Response(services.dashboard_payload(request.user))


class HeatmapView(APIView):
    def get(self, request):
        year_param = request.query_params.get("year")
        try:
            year = int(year_param) if year_param else datetime.now().year
        except ValueError:
            return Response(
                {"error": {"code": "invalid_year", "message": "year must be an integer"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(services.heatmap_payload(request.user, year=year))


class TimelineView(APIView):
    def get(self, request):
        metric = request.query_params.get("metric", "lucid_count")
        if metric not in services.known_metrics():
            return Response(
                {"error": {"code": "invalid_metric", "message": f"unknown metric: {metric}"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        range_param = request.query_params.get("range", "30d")
        if not range_param.endswith("d") or not range_param[:-1].isdigit():
            return Response(
                {"error": {"code": "invalid_range", "message": "range must look like '30d'"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        days = max(1, min(int(range_param[:-1]), 365))
        return Response(services.timeline_payload(request.user, metric=metric, days=days))
