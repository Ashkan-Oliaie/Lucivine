import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReminder,
  deleteReminder,
  listReminders,
  updateReminder,
} from "@/api/reminders";
import type { Reminder, ReminderKind } from "@/api/types";
import { extractMessage } from "@/api/client";
import { IconBell } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { PracticeMeta } from "./practiceMeta";

type Props = {
  /** Practice slug. Used as the `practice_slug` filter on the Reminder model. */
  practiceSlug: string;
  meta: PracticeMeta;
  className?: string;
};

/** Map a practice slug to the closest existing reminder kind so the server
 * cue templates render sensible copy without a schema change. */
function kindForPractice(slug: string): ReminderKind {
  if (slug.startsWith("wbtb_")) return "wbtb";
  if (slug === "journal_entry" || slug === "voice_memo_recall") return "journal";
  if (slug.endsWith("_rc")) return "rc";
  if (
    slug === "mindful_breath_10min" ||
    slug === "afternoon_meditation" ||
    slug === "body_scan" ||
    slug === "evening_chakra_session"
  ) {
    return "meditation";
  }
  return "custom";
}

export function PracticeAlarmButton({ practiceSlug, meta, className }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(meta.defaultReminderTime ?? "07:00");
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["reminders", "by-practice", practiceSlug],
    queryFn: () => listReminders({ practice_slug: practiceSlug }),
    staleTime: 30_000,
  });
  const existing: Reminder | undefined = data?.results[0];

  const create = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setOpen(false);
      setError(null);
    },
    onError: (e) => setError(extractMessage(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Reminder> }) =>
      updateReminder(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setOpen(false);
      setError(null);
    },
    onError: (e) => setError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setOpen(false);
      setError(null);
    },
    onError: (e) => setError(extractMessage(e)),
  });

  // Sync time picker when an existing reminder is loaded.
  useEffect(() => {
    if (existing?.time_of_day) setTime(existing.time_of_day.slice(0, 5));
  }, [existing?.id, existing?.time_of_day]);

  // Click-away to dismiss
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function save() {
    const payload: Partial<Reminder> = {
      kind: kindForPractice(practiceSlug),
      label: meta.label,
      cadence: "daily",
      time_of_day: `${time}:00`,
      channel: "push",
      enabled: true,
      practice_slug: practiceSlug,
    };
    if (existing) {
      update.mutate({ id: existing.id, input: payload });
    } else {
      create.mutate(payload);
    }
  }

  function clear() {
    if (existing) remove.mutate(existing.id);
  }

  const hasAlarm = Boolean(existing?.enabled);
  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={hasAlarm ? `Edit alarm for ${meta.label}` : `Set alarm for ${meta.label}`}
        aria-expanded={open}
        className={cn(
          "shrink-0 flex items-center justify-center rounded-full transition-all focus-ring",
          "h-9 w-9 md:h-10 md:w-10",
          hasAlarm
            ? "bg-accent-mint/15 text-accent-mint hover:bg-accent-mint/25 ring-1 ring-accent-mint/40"
            : "bg-white/[0.04] text-ink-muted hover:text-accent-lavender hover:bg-white/[0.08]",
          busy && "opacity-60",
        )}
        disabled={isPending}
      >
        <IconBell size={16} />
      </button>

      {hasAlarm && existing && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full bg-accent-mint/20 text-accent-mint text-[9px] font-mono tabular-nums leading-none border border-accent-mint/30 pointer-events-none"
          aria-hidden
        >
          {existing.time_of_day.slice(0, 5)}
        </span>
      )}

      {open && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-2 z-50 w-64 glass-strong rounded-xl shadow-glow p-4"
        >
          <p className="ritual-eyebrow mb-2">Daily nudge</p>
          <p className="text-[13px] text-ink-secondary leading-snug mb-3">
            Push notification at this time, every day.
          </p>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-ink-primary focus:outline-none focus:border-accent-lavender/60"
          />
          {error && (
            <p className="mt-2 font-mono text-[10px] text-accent-rose">{error}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            {existing ? (
              <button
                type="button"
                onClick={clear}
                disabled={busy}
                className="text-xs text-accent-rose hover:underline focus-ring"
              >
                Remove
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary focus-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="px-3 py-1.5 rounded-full bg-gradient-to-br from-accent-amethyst to-accent-rose/80 text-ink-primary text-xs font-semibold shadow-[0_8px_20px_-10px_rgba(124,92,255,0.65)] disabled:opacity-50 focus-ring"
              >
                {existing ? "Update" : "Set alarm"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-ink-muted leading-relaxed">
            Push must be allowed for this browser. Manage in Settings.
          </p>
        </div>
      )}
    </div>
  );
}
