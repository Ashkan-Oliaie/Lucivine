import { api } from "./client";
import type { Paginated, RealityCheck, RealityCheckMethod, RealityCheckStats } from "./types";

export async function listRealityChecks(): Promise<Paginated<RealityCheck>> {
  const { data } = await api.get<Paginated<RealityCheck>>("/reality-checks/");
  return data;
}

export async function createRealityCheck(input: {
  method: RealityCheckMethod;
  notes?: string;
  was_lucid_trigger?: boolean;
}): Promise<RealityCheck> {
  const { data } = await api.post<RealityCheck>("/reality-checks/", input);
  return data;
}

export async function fetchRealityStats(): Promise<RealityCheckStats> {
  const { data } = await api.get<RealityCheckStats>("/reality-checks/stats/");
  return data;
}
