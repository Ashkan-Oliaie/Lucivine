import { api } from "./client";
import type { Dashboard, Heatmap, Timeline, TimelineMetric } from "./types";

export async function fetchDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/analytics/dashboard/");
  return data;
}

export async function fetchHeatmap(year?: number): Promise<Heatmap> {
  const { data } = await api.get<Heatmap>("/analytics/heatmap/", {
    params: year ? { year } : {},
  });
  return data;
}

export async function fetchTimeline(
  metric: TimelineMetric,
  range: string = "30d",
): Promise<Timeline> {
  const { data } = await api.get<Timeline>("/analytics/timeline/", {
    params: { metric, range },
  });
  return data;
}
