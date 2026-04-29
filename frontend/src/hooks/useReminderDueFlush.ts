import { useEffect } from "react";
import { flushDueReminders } from "@/api/reminders";

/** Match coarse polling granularity — reminders fire when this endpoint runs + next_fire_at ≤ now (wall-clock seconds are best-effort). */
const INTERVAL_MS = 15_000;

/**
 * While authenticated, periodically asks the backend to deliver overdue reminders.
 * Server-side pushes still require Cloud Scheduler / docker `scheduler`; this fills the gap
 * when those ticks aren’t running (e.g. backend-only dev) and backs up missed ticks when a tab is open.
 */
export function useReminderDueFlush(hasSession: boolean) {
  useEffect(() => {
    if (!hasSession) return;

    function tick() {
      flushDueReminders().catch(() => {
        /* offline / 401 — ignore */
      });
    }

    tick();
    const id = window.setInterval(tick, INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hasSession]);
}
