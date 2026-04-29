from django.urls import path

from .views import DashboardView, HeatmapView, TimelineView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="analytics-dashboard"),
    path("heatmap/", HeatmapView.as_view(), name="analytics-heatmap"),
    path("timeline/", TimelineView.as_view(), name="analytics-timeline"),
]
