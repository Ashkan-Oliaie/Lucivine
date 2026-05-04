import { api } from "./client";
import type {
  Paginated,
  QuestAttempt,
  QuestList,
  QuestLogEntry,
  UserQuest,
} from "./types";

export async function fetchQuestList(week?: number): Promise<QuestList> {
  const { data } = await api.get<QuestList>("/quests/", {
    params: week ? { week } : undefined,
  });
  return data;
}

export async function logQuestAttempt(input: {
  quest: string;
  dream_entry?: string | null;
  success_rating: number;
  notes?: string;
}): Promise<QuestAttempt> {
  const { data } = await api.post<QuestAttempt>("/quests/attempts/", input);
  return data;
}

export async function listQuestAttempts(): Promise<Paginated<QuestAttempt>> {
  const { data } = await api.get<Paginated<QuestAttempt>>("/quests/attempts/");
  return data;
}

export async function fetchQuestLog(): Promise<QuestLogEntry[]> {
  const { data } = await api.get<QuestLogEntry[]>("/quests/log/");
  return data;
}

/** Start tracking a quest (idempotent — re-tracking re-enables `is_tracked`). */
export async function trackQuest(questId: string): Promise<UserQuest> {
  const { data } = await api.post<UserQuest>("/quests/tracking/", {
    quest: questId,
  });
  return data;
}

export async function untrackQuest(userQuestId: string): Promise<void> {
  await api.delete(`/quests/tracking/${userQuestId}/`);
}

export async function updateQuestTracking(
  userQuestId: string,
  patch: Partial<Pick<UserQuest, "is_tracked" | "progress">>,
): Promise<UserQuest> {
  const { data } = await api.patch<UserQuest>(
    `/quests/tracking/${userQuestId}/`,
    patch,
  );
  return data;
}

export async function completeQuestTracking(userQuestId: string): Promise<UserQuest> {
  const { data } = await api.post<UserQuest>(
    `/quests/tracking/${userQuestId}/complete/`,
  );
  return data;
}

export async function listUserQuests(): Promise<Paginated<UserQuest>> {
  const { data } = await api.get<Paginated<UserQuest>>("/quests/tracking/");
  return data;
}
