import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotificationPermissionCard } from "@/components/notifications/NotificationPermissionCard";
import {
  createReminder,
  deleteReminder,
  listReminders,
  testReminder,
  updateReminder,
} from "@/api/reminders";
import type { Reminder, ReminderCadence, ReminderKind } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";
import { formatNextFireLabel } from "@/lib/datetime";
import { useAuthStore } from "@/stores/auth";

const KIND_LABELS: Record<ReminderKind, string> = {
  rc: "Reality check",
  meditation: "Meditation",
  journal: "Journal",
  wbtb: "Wake back to bed",
  custom: "Custom",
};

/** Quick picks + custom input clamp to backend 1–1440 (serializers.ReminderSerializer). */
const INTERVAL_QUICK_MINUTES = [1, 2, 5, 15, 30, 60, 90, 120, 180] as const;
const MIN_INTERVAL = 1;
const MAX_INTERVAL = 1440;

const PRESETS: Array<{ label: string; partial: Partial<Reminder> }> = [
  {
    label: "RC every 2h, 9am–9pm",
    partial: {
      kind: "rc",
      cadence: "interval",
      time_of_day: "09:00:00",
      active_until: "21:00:00",
      interval_minutes: 120,
    },
  },
  {
    label: "Morning meditation 7am",
    partial: {
      kind: "meditation",
      cadence: "daily",
      time_of_day: "07:00:00",
    },
  },
  {
    label: "Wake-still journal 7:30am",
    partial: {
      kind: "journal",
      cadence: "daily",
      time_of_day: "07:30:00",
    },
  },
  {
    label: "WBTB 3am",
    partial: {
      kind: "wbtb",
      cadence: "daily",
      time_of_day: "03:00:00",
    },
  },
];

export default function RemindersPage() {
  const qc = useQueryClient();
  const profileTz = useAuthStore((s) => s.user?.timezone);
  const [creating, setCreating] = useState<Partial<Reminder> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const {
    data,
    isPending,
    isError,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["reminders"],
    queryFn: listReminders,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setCreating(null);
    },
    onError: (err) => setError(extractMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Reminder> }) =>
      updateReminder(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const remove = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setDeleteTargetId(null);
    },
  });

  const test = useMutation({
    mutationFn: testReminder,
  });

  const reminders = data?.results ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="ritual-eyebrow mb-3">Reminders</p>
      <h1 className=" text-4xl md:text-5xl font-light text-ink-primary">
        Pull yourself <em className="text-gradient">back to awareness</em>.
      </h1>
      <p className=" italic text-ink-secondary text-base md:text-lg mt-4 max-w-2xl">
        Scheduled reminders send push notifications while notifications are enabled for this browser.
        Pause keeps the schedule on file; delete removes it permanently.
      </p>

      <div className="mt-8">
        <NotificationPermissionCard />
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className=" text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1">
              Your scheduled reminders
            </p>
            <p className="text-sm text-ink-secondary max-w-xl">
              Everything below is stored on your account — pause with <strong className="text-ink-primary font-medium">Paused</strong>, or{" "}
              <strong className="text-ink-primary font-medium">Delete</strong> to remove.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            loading={isFetching && !isPending}
            className="shrink-0"
          >
            Refresh list
          </Button>
        </div>

        {isPending && (
          <Card>
            <p className="text-ink-secondary italic">Loading your reminders…</p>
          </Card>
        )}

        {isError && !isPending && (
          <Card className="border-accent-rose/30">
            <p className="text-ink-primary font-medium">Couldn&apos;t load reminders</p>
            <p className="text-sm text-ink-secondary mt-2">{extractMessage(queryError)}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
              Try again
            </Button>
          </Card>
        )}

        {!isPending && !isError && reminders.length === 0 && (
          <Card>
            <p className=" italic text-ink-secondary">
              No reminders saved yet. Create one below — daily or repeating interval — then it appears here so you can pause or delete anytime.
            </p>
          </Card>
        )}

        {!isPending && !isError && reminders.length > 0 && (
          <ul className="space-y-3">
            {reminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                profileTz={profileTz}
                onToggle={(enabled) =>
                  update.mutate({ id: r.id, input: { enabled } })
                }
                onTest={() => test.mutate(r.id)}
                onDelete={() => setDeleteTargetId(r.id)}
                tested={test.data && test.variables === r.id ? test.data : null}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <p className=" text-xs font-semibold uppercase tracking-wide text-ink-muted mb-4">
          Add a reminder
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setCreating(preset.partial)}
              className="text-left p-4 rounded-md border border-white/10 hover:border-accent-lavender/40 hover:bg-white/[0.02] transition-all"
            >
              <p className=" text-ink-primary">{preset.label}</p>
              <p className=" text-[11px] font-semibold uppercase tracking-wide text-ink-muted mt-1">
                {KIND_LABELS[preset.partial.kind!]} ·{" "}
                {preset.partial.cadence === "interval"
                  ? `every ${preset.partial.interval_minutes}m`
                  : "daily"}
              </p>
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            setCreating({
              kind: "custom",
              cadence: "daily",
              time_of_day: "20:00:00",
            })
          }
          className="mt-4"
        >
          Custom reminder
        </Button>
      </section>

      <ReminderForm
        draft={creating}
        onClose={() => {
          setCreating(null);
          setError(null);
        }}
        onSave={(input) => create.mutate(input)}
        saving={create.isPending}
        error={error}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this reminder?"
        description="This removes the schedule from your account. You can add a new reminder anytime."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={remove.isPending}
        onClose={() => !remove.isPending && setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) remove.mutate(deleteTargetId);
        }}
      />
    </motion.div>
  );
}

function ReminderCard({
  reminder,
  profileTz,
  onToggle,
  onTest,
  onDelete,
  tested,
}: {
  reminder: Reminder;
  profileTz?: string | null;
  onToggle: (enabled: boolean) => void;
  onTest: () => void;
  onDelete: () => void;
  tested: { delivered: boolean; error: string } | null;
}) {
  return (
    <Card className={cn(!reminder.enabled && "opacity-90 border-white/[0.06]")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className=" text-lg text-ink-primary">
            {reminder.label || KIND_LABELS[reminder.kind]}
          </p>
          <p className=" text-xs font-semibold uppercase tracking-wide text-ink-muted mt-1">
            {reminder.cadence === "interval"
              ? `every ${reminder.interval_minutes}m · ${reminder.time_of_day.slice(0, 5)}–${reminder.active_until?.slice(0, 5)}`
              : `daily at ${reminder.time_of_day.slice(0, 5)}`}
          </p>
          <p className="font-mono text-[10px] text-ink-muted mt-2 leading-relaxed">
            <span className="text-ink-muted">Next fire: </span>
            {formatNextFireLabel(reminder.next_fire_at, profileTz)}
          </p>
          {tested && (
            <p
              className={cn(
                "mt-2 text-[11px] font-semibold uppercase tracking-wide",
                tested.delivered ? "text-accent-mint" : "text-accent-rose",
              )}
            >
              {tested.delivered ? "Test push sent" : `Test failed: ${tested.error || "unknown"}`}
            </p>
          )}
        </div>
        <label className="flex flex-col items-end gap-1 shrink-0 cursor-pointer select-none">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide",
              reminder.enabled ? "text-accent-mint" : "text-ink-muted",
            )}
          >
            {reminder.enabled ? "On" : "Paused"}
          </span>
          <input
            type="checkbox"
            checked={reminder.enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-5 h-5 accent-accent-amethyst"
            aria-label={reminder.enabled ? "Pause reminder" : "Resume reminder"}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
        <Button variant="outline" size="sm" onClick={onTest}>
          Test push
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-accent-rose hover:text-accent-rose hover:bg-accent-rose/10 ml-auto sm:ml-0"
        >
          Delete reminder
        </Button>
      </div>
    </Card>
  );
}

function ReminderForm({
  draft,
  onClose,
  onSave,
  saving,
  error,
}: {
  draft: Partial<Reminder> | null;
  onClose: () => void;
  onSave: (input: Partial<Reminder>) => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<Partial<Reminder>>({});

  // Reset form when draft changes
  useEffectOnDraft(draft, setForm);

  if (!draft) return null;

  const cadence = (form.cadence ?? "daily") as ReminderCadence;
  const isInterval = cadence === "interval";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Partial<Reminder> = { ...form };
    if ((payload.cadence ?? "daily") === "interval") {
      let mins = payload.interval_minutes;
      if (mins == null || mins < MIN_INTERVAL) mins = 60;
      if (mins > MAX_INTERVAL) mins = MAX_INTERVAL;
      payload.interval_minutes = mins;
    }
    onSave(payload);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-void/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
        onClick={onClose}
      >
        <motion.form
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          onSubmit={submit}
          className="w-full max-w-lg bg-deep border border-white/10 md:rounded-xl rounded-t-xl p-6 md:p-8 max-h-[85vh] overflow-y-auto space-y-5 shadow-glow"
        >
          <p className=" text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            New reminder
          </p>

          <div>
            <span className=" text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2 block">
              Kind
            </span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(KIND_LABELS) as ReminderKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, kind: k })}
                  className={cn(
                    "px-3 py-2 rounded-md border text-xs font-semibold uppercase tracking-wide",
                    form.kind === k
                      ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                      : "border-white/10 text-ink-secondary",
                  )}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className=" text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2 block">
              Cadence
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, cadence: "daily" })}
                className={cn(
                  "flex-1 py-2.5 rounded-md border text-xs font-semibold uppercase tracking-wide",
                  cadence === "daily"
                    ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                    : "border-white/10 text-ink-secondary",
                )}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    cadence: "interval",
                    interval_minutes: form.interval_minutes ?? 60,
                  })
                }
                className={cn(
                  "flex-1 py-2.5 rounded-md border text-xs font-semibold uppercase tracking-wide",
                  cadence === "interval"
                    ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                    : "border-white/10 text-ink-secondary",
                )}
              >
                Interval
              </button>
            </div>
          </div>

          <TimeField
            label={isInterval ? "Start" : "Time"}
            value={form.time_of_day ?? ""}
            onChange={(v) => setForm({ ...form, time_of_day: v })}
          />

          {isInterval && (
            <>
              <TimeField
                label="End"
                value={form.active_until ?? ""}
                onChange={(v) => setForm({ ...form, active_until: v })}
              />
              <div>
                <span className=" text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2 block">
                  Every (minutes)
                </span>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_QUICK_MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, interval_minutes: m })}
                      className={cn(
                        "min-w-[3rem] py-2.5 px-2 rounded-md border text-xs font-semibold uppercase tracking-wide",
                        form.interval_minutes === m
                          ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                          : "border-white/10 text-ink-secondary",
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2 block">
                    Custom interval
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={MIN_INTERVAL}
                      max={MAX_INTERVAL}
                      step={1}
                      inputMode="numeric"
                      placeholder={`${MIN_INTERVAL}–${MAX_INTERVAL}`}
                      value={
                        form.interval_minutes !== undefined && form.interval_minutes !== null
                          ? form.interval_minutes
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setForm({ ...form, interval_minutes: undefined });
                          return;
                        }
                        const n = Number.parseInt(raw, 10);
                        if (Number.isNaN(n)) return;
                        const clamped = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, n));
                        setForm({ ...form, interval_minutes: clamped });
                      }}
                      className="w-full max-w-[11rem] bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60 tabular-nums"
                    />
                    <span className="text-sm text-ink-muted shrink-0">min between nudges</span>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-muted leading-relaxed">
                    Between {MIN_INTERVAL} and {MAX_INTERVAL} minutes (up to 24 hours).
                  </p>
                </label>
              </div>
            </>
          )}

          {form.kind === "custom" && (
            <div>
              <span className=" text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2 block">
                Label
              </span>
              <input
                value={form.label ?? ""}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="What is this nudge for?"
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60"
              />
            </div>
          )}

          {error && <p className="font-mono text-[10px] text-accent-rose">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Set
            </Button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className=" text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-2 block">
        {label}
      </span>
      <input
        type="time"
        value={value.slice(0, 5)}
        onChange={(e) => onChange(`${e.target.value}:00`)}
        className="w-full bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-ink-primary focus:outline-none focus:border-accent-lavender/60"
      />
    </div>
  );
}

function useEffectOnDraft(
  draft: Partial<Reminder> | null,
  set: (v: Partial<Reminder>) => void,
) {
  useEffect(() => {
    if (draft) set(draft);
  }, [draft, set]);
}
