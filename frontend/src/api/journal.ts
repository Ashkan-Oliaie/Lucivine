import { api } from "./client";
import type { DreamEntry, JournalStats, Paginated } from "./types";

export type JournalListParams = {
  is_lucid?: boolean;
  technique?: string;
  search?: string;
  from?: string;
  to?: string;
  ordering?: string;
};

export async function listDreams(params: JournalListParams = {}): Promise<Paginated<DreamEntry>> {
  const { data } = await api.get<Paginated<DreamEntry>>("/journal/entries/", { params });
  return data;
}

export async function fetchDream(id: string): Promise<DreamEntry> {
  const { data } = await api.get<DreamEntry>(`/journal/entries/${id}/`);
  return data;
}

export async function createDream(input: Partial<DreamEntry>): Promise<DreamEntry> {
  const { data } = await api.post<DreamEntry>("/journal/entries/", input);
  return data;
}

export async function updateDream(id: string, input: Partial<DreamEntry>): Promise<DreamEntry> {
  const { data } = await api.patch<DreamEntry>(`/journal/entries/${id}/`, input);
  return data;
}

export async function deleteDream(id: string): Promise<void> {
  await api.delete(`/journal/entries/${id}/`);
}

export async function fetchJournalStats(): Promise<JournalStats> {
  const { data } = await api.get<JournalStats>("/journal/entries/stats/");
  return data;
}
