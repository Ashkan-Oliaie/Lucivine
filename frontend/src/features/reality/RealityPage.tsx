import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  createRealityCheck,
  fetchRealityStats,
  listRealityChecks,
} from "@/api/realityChecks";
import type { RealityCheckMethod } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";

type Method = {
  id: RealityCheckMethod;
  label: string;
  cue: string;
  longCue: string;
  steps: string[];
  glyph: string;
};

const METHODS: Method[] = [
  {
    id: "hand",
    label: "Hands",
    cue: "Count fingers slowly.",
    longCue:
      "In dreams the hand betrays itself — fingers shift, blur, or multiply. Trust the doubt.",
    steps: ["Look at your palm.", "Count each finger slowly.", "Notice if anything looks wrong."],
    glyph: "✋",
  },
  {
    id: "nose",
    label: "Breath",
    cue: "Pinch nose. Try to inhale.",
    longCue:
      "If air still flows when your nostrils are closed, the body you wear is not the waking one.",
    steps: ["Pinch your nostrils shut.", "Close your mouth.", "Try to breathe in."],
    glyph: "༄",
  },
  {
    id: "text",
    label: "Text",
    cue: "Read words. Look away. Read again.",
    longCue:
      "Letters drift between glances in the dream — they refuse to hold their shape twice.",
    steps: ["Read a sentence.", "Look away for a beat.", "Read the same sentence again."],
    glyph: "✍",
  },
  {
    id: "clock",
    label: "Clock",
    cue: "Read the time. Look away. Read again.",
    longCue:
      "Dream-clocks lose their numbers. Look once, look away, look back — and watch what changes.",
    steps: ["Find the nearest clock.", "Note the exact time.", "Look away, then look back."],
    glyph: "◴",
  },
  {
    id: "light",
    label: "Light",
    cue: "Flick the switch. Test reality.",
    longCue:
      "Brightness in dreams rarely obeys — switches lag, fade, or refuse altogether.",
    steps: ["Find a light switch.", "Flick it on and off.", "Watch how the room responds."],
    glyph: "✺",
  },
  {
    id: "mirror",
    label: "Mirror",
    cue: "Examine your reflection.",
    longCue:
      "The face in a dream-mirror warps, lags, or hides. Hold your gaze and see who looks back.",
    steps: ["Find a mirror.", "Look at your own face.", "Hold the gaze for a few seconds."],
    glyph: "◐",
  },
  {
    id: "memory",
    label: "Memory",
    cue: "Recall the last hour.",
    longCue:
      "Dream-memory is fog. If the path back is missing, you are already inside the dream.",
    steps: ["Pause where you are.", "Retrace the past hour.", "Notice any gaps."],
    glyph: "❀",
  },
  {
    id: "jump",
    label: "Float",
    cue: "Jump and feel for gravity.",
    longCue:
      "In dreams the body lingers in the air a moment too long. Listen for the delay.",
    steps: ["Stand somewhere safe.", "Jump gently.", "Feel how the descent lands."],
    glyph: "↟",
  },
];

const METHOD_BY_ID: Record<RealityCheckMethod, Method> = METHODS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<RealityCheckMethod, Method>,
);

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function RealityPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<Method | null>(null);
  const [notes, setNotes] = useState("");
  const [wasTrigger, setWasTrigger] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["reality-stats"],
    queryFn: fetchRealityStats,
  });

  const { data: list } = useQuery({
    queryKey: ["reality-checks"],
    queryFn: listRealityChecks,
  });

  const create = useMutation({
    mutationFn: createRealityCheck,
    onSuccess: (rc) => {
      qc.invalidateQueries({ queryKey: ["reality-checks"] });
      qc.invalidateQueries({ queryKey: ["reality-stats"] });
      toast.success({
        title: "Check logged",
        description: rc.was_lucid_trigger
          ? `${METHOD_BY_ID[rc.method].label} — became lucid`
          : `${METHOD_BY_ID[rc.method].label} — stay curious.`,
      });
      closeDialog();
    },
    onError: (err) =>
      toast.error({
        title: "Could not log check",
        description: extractMessage(err, "Try again in a moment."),
      }),
  });

  function openDialog(m: Method) {
    setSelected(m);
    setNotes("");
    setWasTrigger(false);
  }

  function closeDialog() {
    setSelected(null);
    setNotes("");
    setWasTrigger(false);
  }

  function submit() {
    if (!selected) return;
    create.mutate({
      method: selected.id,
      notes: notes.trim() || undefined,
      was_lucid_trigger: wasTrigger || undefined,
    });
  }

  const total30 = stats?.last_30_days_total ?? 0;
  const recent = list?.results ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="ritual-eyebrow mb-3">Reality</p>
      <h1 className="text-5xl md:text-6xl font-light text-ink-primary leading-[1.05] tracking-tight">
        <em className="text-accent-lavender">Question</em> the waking world.
      </h1>
      <p className="italic text-ink-secondary/85 text-base md:text-lg mt-5 max-w-xl leading-relaxed">
        Each check is a thread you tug — eventually one snaps and you wake within the dream.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-12 md:mt-14">
        {METHODS.map((m, i) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openDialog(m)}
            className={cn(
              "group relative rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-5 md:p-6 text-left transition-all duration-300 overflow-hidden",
              "hover:border-accent-lavender/40 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-20px_theme(colors.accent.amethyst)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="ritual-eyebrow !text-[10px]">{m.label}</p>
              <span
                aria-hidden
                className="text-lg text-accent-lavender/50 group-hover:text-accent-lavender transition-colors"
              >
                {m.glyph}
              </span>
            </div>
            <p className="text-ink-primary text-sm md:text-[15px] leading-snug">
              {m.cue}
            </p>
            <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-lavender/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <Card className="md:col-span-1">
          <p className="ritual-eyebrow mb-3">Last 30 days</p>
          <p className="text-5xl text-ink-primary font-light tabular-nums">
            {total30}
          </p>
          <p className="italic text-sm text-ink-secondary mt-2">
            {total30 === 0
              ? "Begin your first thread."
              : total30 === 1
                ? "thread tugged"
                : "threads tugged"}
          </p>
        </Card>
        <Card className="md:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <p className="ritual-eyebrow">Recent</p>
            {recent.length > 0 && (
              <p className="text-[11px] text-ink-muted tabular-nums">
                {recent.length} shown
              </p>
            )}
          </div>
          {recent.length ? (
            <ul className="space-y-2.5">
              {recent.slice(0, 6).map((rc) => {
                const m = METHOD_BY_ID[rc.method];
                return (
                  <li
                    key={rc.id}
                    className="flex items-center gap-3 text-sm py-1"
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-accent-lavender/80"
                    >
                      {m?.glyph ?? "·"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink-primary capitalize truncate">
                        {m?.label ?? rc.method}
                        {rc.was_lucid_trigger && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-accent-amber">
                            lucid
                          </span>
                        )}
                      </p>
                      {rc.notes && (
                        <p className="text-[12px] text-ink-muted truncate">
                          {rc.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-ink-muted shrink-0">
                      {formatRelative(rc.performed_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="italic text-ink-secondary">No checks logged yet.</p>
          )}
        </Card>
      </div>

      <RealityCheckDialog
        method={selected}
        notes={notes}
        onNotesChange={setNotes}
        wasTrigger={wasTrigger}
        onWasTriggerChange={setWasTrigger}
        onClose={closeDialog}
        onSubmit={submit}
        loading={create.isPending}
      />
    </motion.div>
  );
}

function RealityCheckDialog({
  method,
  notes,
  onNotesChange,
  wasTrigger,
  onWasTriggerChange,
  onClose,
  onSubmit,
  loading,
}: {
  method: Method | null;
  notes: string;
  onNotesChange: (v: string) => void;
  wasTrigger: boolean;
  onWasTriggerChange: (v: boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  // Focus the first interactive element on open
  useEffect(() => {
    if (!method) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(
        "reality-check-notes",
      ) as HTMLTextAreaElement | null;
      el?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [method]);

  return (
    <Modal
      open={Boolean(method)}
      onClose={loading ? () => {} : onClose}
      eyebrow="Reality check"
      title={method?.label}
      size="sm"
    >
      <AnimatePresence mode="wait">
        {method && (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="font-sans"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-accent-amethyst/25 to-accent-rose/10 text-[26px] text-accent-lavender shadow-[0_10px_36px_-14px_rgba(124,92,255,0.55)]"
              >
                {method.glyph}
              </span>
              <p className="font-sans italic text-[15px] md:text-base text-ink-secondary leading-relaxed flex-1">
                {method.longCue}
              </p>
            </div>

            <ol className="mt-5 space-y-2">
              {method.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                >
                  <span
                    aria-hidden
                    className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent-lavender/30 bg-accent-lavender/10 font-sans text-[11px] font-semibold tabular-nums text-accent-lavender"
                  >
                    {idx + 1}
                  </span>
                  <span className="font-sans text-[14px] text-ink-primary leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <label
                htmlFor="reality-check-notes"
                className="block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-2"
              >
                Note <span className="font-normal normal-case tracking-normal text-ink-muted/70">(optional)</span>
              </label>
              <textarea
                id="reality-check-notes"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
                placeholder="What was strange? What held?"
                className="w-full font-sans bg-white/[0.025] border border-white/10 rounded-xl px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted/55 leading-relaxed focus:outline-none focus:border-accent-lavender/60 focus:bg-white/[0.04] transition-colors resize-y"
              />
            </div>

            <label className="mt-4 flex items-center gap-3 cursor-pointer select-none rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 hover:border-accent-amber/30 hover:bg-accent-amber/[0.03] transition-colors">
              <input
                type="checkbox"
                checked={wasTrigger}
                onChange={(e) => onWasTriggerChange(e.target.checked)}
                className="w-4 h-4 accent-accent-amber"
              />
              <span className="flex-1 font-sans text-sm text-ink-primary">
                This check made me lucid
              </span>
              {wasTrigger && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent-amber">
                  ✦ lucid
                </span>
              )}
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="button" onClick={onSubmit} loading={loading}>
                Log check
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
