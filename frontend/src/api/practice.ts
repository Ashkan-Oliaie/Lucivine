import { api } from "./client";
import type { UserProgress, WeeklyProgram } from "./types";

export async function fetchProgram(): Promise<WeeklyProgram[]> {
  const { data } = await api.get<WeeklyProgram[]>("/practice/program/");
  return data;
}

export async function fetchProgress(): Promise<UserProgress[]> {
  const { data } = await api.get<UserProgress[]>("/practice/progress/");
  return data;
}

export async function completeDay(
  weekNumber: number,
  body: { date: string; practices: string[] },
): Promise<UserProgress> {
  const { data } = await api.post<UserProgress>(
    `/practice/progress/${weekNumber}/complete-day/`,
    body,
  );
  return data;
}

export async function setCurrentWeek(weekNumber: number): Promise<{ current_week: number }> {
  const { data } = await api.patch<{ current_week: number }>(
    "/practice/progress/current-week/",
    { week_number: weekNumber },
  );
  return data;
}
