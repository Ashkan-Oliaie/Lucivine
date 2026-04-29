/** Format an ISO UTC timestamp in the user's profile timezone (falls back to browser TZ). */
export function formatNextFireLabel(isoUtc: string | undefined | null, profileTz?: string | null): string {
  if (!isoUtc) return "—";
  const fallbackTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tz = profileTz?.trim() ? profileTz : fallbackTz;
  try {
    return new Date(isoUtc).toLocaleString(undefined, {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(isoUtc).toLocaleString();
  }
}
