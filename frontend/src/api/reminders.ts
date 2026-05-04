import { api } from "./client";
import type { Paginated, Reminder } from "./types";

/** DRF LimitOffset payload — tolerate odd proxies / parsing so the UI never treats broken HTML as “zero reminders”. */
function normalizeReminderList(payload: unknown): Paginated<Reminder> {
  const empty: Paginated<Reminder> = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
  if (payload == null || typeof payload !== "object") return empty;
  if (Array.isArray(payload)) {
    const results = payload as Reminder[];
    return { ...empty, count: results.length, results };
  }
  const o = payload as Record<string, unknown>;
  const raw = o.results;
  if (!Array.isArray(raw)) return empty;
  const results = raw as Reminder[];
  const count = typeof o.count === "number" ? o.count : results.length;
  return {
    count,
    next: typeof o.next === "string" || o.next === null ? (o.next as string | null) : null,
    previous:
      typeof o.previous === "string" || o.previous === null ? (o.previous as string | null) : null,
    results,
  };
}

export async function listReminders(params?: {
  practice_slug?: string;
}): Promise<Paginated<Reminder>> {
  const { data } = await api.get<unknown>("/reminders/", {
    params: { limit: 200, ...(params ?? {}) },
  });
  return normalizeReminderList(data);
}

export async function createReminder(input: Partial<Reminder>): Promise<Reminder> {
  const { data } = await api.post<Reminder>("/reminders/", input);
  return data;
}

export async function updateReminder(id: string, input: Partial<Reminder>): Promise<Reminder> {
  const { data } = await api.patch<Reminder>(`/reminders/${id}/`, input);
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  await api.delete(`/reminders/${id}/`);
}

export async function testReminder(id: string): Promise<{ delivered: boolean; error: string }> {
  const { data } = await api.post(`/reminders/${id}/test/`);
  return data;
}

/** Ask the server to deliver any overdue reminders for this session (runs ~every minute while logged in). */
export async function flushDueReminders(): Promise<{
  fired: number;
  results: Array<{ reminder_id: string; delivered: boolean; error: string }>;
}> {
  const { data } = await api.post("/reminders/flush-due/");
  return data;
}
