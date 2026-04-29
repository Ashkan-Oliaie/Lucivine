import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  completeDay,
  fetchProgram,
  fetchProgress,
  setCurrentWeek,
} from "@/api/practice";
import { fetchDashboard } from "@/api/analytics";
import { useAuthStore } from "@/stores/auth";
import type { WeeklyProgram } from "@/api/types";
import { cn } from "@/lib/cn";
import { extractMessage } from "@/api/client";
import { PathSummaryAside } from "./PathSummaryAside";

type PracticeMeta = {
  label: string;
  glyph: string;
  description: string;
  steps: string[];
  duration: string;
};

const PRACTICE_META: Record<string, PracticeMeta> = {
  morning_recall: {
    label: "Morning recall",
    glyph: "☀",
    description:
      "On waking, stay still. Replay anything — a feeling, a fragment — before it dissolves.",
    steps: [
      "Don't move or open your eyes when you wake.",
      "Hold whatever drifts up — a colour, a face, a place.",
      "Reach for your journal only once you have something to anchor.",
    ],
    duration: "3–5 min",
  },
  rc_every_2h: {
    label: "Reality check every 2h",
    glyph: "○",
    description:
      "A small, deliberate question to waking life — repeated until it slips into dreams.",
    steps: [
      "Pause. Ask: am I dreaming?",
      "Try a check (count fingers, push a thumb through your palm).",
      "Look around for one detail that *doesn't* fit.",
    ],
    duration: "30 sec",
  },
  evening_reflection: {
    label: "Evening reflection",
    glyph: "☾",
    description:
      "Before sleep, set the night's intention. Tell yourself you'll notice.",
    steps: [
      "Lie still. Slow the breath.",
      "Picture the moment you'd realise you're dreaming.",
      "Say it: 'Tonight, I'll notice.'",
    ],
    duration: "5 min",
  },
  journal_entry: {
    label: "Journal entry",
    glyph: "❍",
    description:
      "A written entry — even a sentence — strengthens the recall muscle and trains the symbols.",
    steps: [
      "Open a new entry the moment you wake.",
      "Title it with whatever lingers — even nonsense.",
      "Tag the strongest feeling and one symbol.",
    ],
    duration: "5–10 min",
  },
  wake_recall_freeze: {
    label: "Wake-still recall",
    glyph: "≡",
    description:
      "Resist movement. Movement is the river that washes the dream away.",
    steps: [
      "Don't open your eyes. Don't shift position.",
      "Stay for 60 seconds. Let the dream surface.",
      "Move only when you have the thread.",
    ],
    duration: "1–3 min",
  },
  voice_memo_recall: {
    label: "Voice-memo recall",
    glyph: "♪",
    description:
      "Speak the dream while it's hot. Words come faster than fingers.",
    steps: [
      "Phone within reach before you sleep.",
      "On waking, hit record without sitting up.",
      "Whisper the fragments. Transcribe later.",
    ],
    duration: "2–4 min",
  },
  afternoon_meditation: {
    label: "Afternoon meditation",
    glyph: "✦",
    description:
      "A short stillness in the day. Trains the gentle attention you'll need at the threshold.",
    steps: [
      "Sit. Eyes soft or closed.",
      "Follow the breath without steering it.",
      "When the mind drifts, return — without judgement.",
    ],
    duration: "10–20 min",
  },
  wbtb_3am: {
    label: "Wake back to bed",
    glyph: "◐",
    description:
      "Wake briefly mid-sleep to catch the lucid window when REM is richest.",
    steps: [
      "Set an alarm for ~5 hours after sleep onset.",
      "Stay up 15–20 min, lights low. Re-read your last dream.",
      "Return to bed with the intention: 'I'll notice.'",
    ],
    duration: "20 min awake",
  },
  wild_attempt: {
    label: "WILD attempt",
    glyph: "≈",
    description:
      "Wake-induced lucid: keep the body asleep, the mind awake. Slip across the threshold consciously.",
    steps: [
      "After WBTB, lie still on your back.",
      "Watch hypnagogic imagery without grabbing.",
      "Let the body fall. Stay aware as the dream forms.",
    ],
    duration: "15–40 min",
  },
};

function metaFor(key: string): PracticeMeta {
  return (
    PRACTICE_META[key] ?? {
      label: key.replace(/_/g, " "),
      glyph: "·",
      description: "",
      steps: [],
      duration: "",
    }
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProgramPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [activePractice, setActivePractice] = useState<{
    week: number;
    practice: string;
  } | null>(null);

  const { data: program } = useQuery({
    queryKey: ["program"],
    queryFn: fetchProgram,
    staleTime: 60 * 60_000,
  });

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const switchWeek = useMutation({
    mutationFn: setCurrentWeek,
    onSuccess: ({ current_week }) => {
      if (user) setUser({ ...user, current_week });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (err) => setError(extractMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: ({ week, practice }: { week: number; practice: string }) =>
      completeDay(week, { date: todayISO(), practices: [practice] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => setError(extractMessage(err)),
  });

  const progressByWeek = useMemo(
    () => new Map(progress?.map((p) => [p.week_number, p]) ?? []),
    [progress],
  );

  const currentWeek =
    program?.find((w) => w.week_number === user?.current_week) ?? program?.[0];
  const currentProgress = currentWeek
    ? progressByWeek.get(currentWeek.week_number)
    : undefined;
  const todaysCompleted = currentProgress?.daily_completion_log[todayISO()] ?? [];
  const todaysTotal = currentWeek?.daily_practices.length ?? 0;
  const todaysPct = todaysTotal
    ? Math.round((todaysCompleted.length / todaysTotal) * 100)
    : 0;

  const totalWeeks = program?.length ?? 6;
  const programProgressPct = Math.round(
    ((user?.current_week ?? 1) - 1) / Math.max(1, totalWeeks - 1) * 100,
  );

  const pathAsideProps = {
    streak: dashboard?.streak ?? user?.streak_count ?? 0,
    lucid: dashboard?.totals.lucid_dreams ?? 0,
    week: user?.current_week ?? 1,
    totalWeeks,
    programProgressPct,
  };

  return (
    <>
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-8 xl:gap-12 items-start">
      <div className="min-w-0 space-y-10 md:space-y-14">
        <header className="border-b border-white/[0.06] pb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink-primary">
            Your program
          </h1>
          <p className="text-sm text-ink-secondary mt-2 max-w-2xl leading-relaxed">
            Today’s practices and your place in the six-week sequence.
          </p>
        </header>

        {/* Path overview — stacks below header on phones; duplicated in sidebar on lg */}
        <div className="lg:hidden">
          <PathSummaryAside {...pathAsideProps} />
        </div>

      {/* Today's ritual — current week practices, expanded */}
      {currentWeek && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-0"
        >
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="ritual-eyebrow mb-1.5">Today's ritual</p>
              <h2 className="text-xl md:text-2xl font-semibold text-ink-primary">
                Week {currentWeek.week_number} ·{" "}
                <span className="text-accent-lavender">{currentWeek.title}</span>
              </h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                Today
              </p>
              <p className="text-2xl md:text-3xl font-semibold text-ink-primary leading-none mt-1 tabular-nums">
                {todaysCompleted.length}
                <span className="text-ink-muted font-normal">/{todaysTotal}</span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-amethyst via-accent-rose to-accent-amber rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${todaysPct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <p className="text-ink-secondary text-sm md:text-base mb-6 max-w-2xl leading-relaxed">
            {currentWeek.focus}
          </p>

          {error && (
            <p className="mb-4 text-xs text-accent-rose">{error}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {currentWeek.daily_practices.map((p, idx) => {
              const meta = metaFor(p);
              const done = todaysCompleted.includes(p);
              return (
                <PracticeCard
                  key={p}
                  index={idx}
                  meta={meta}
                  done={done}
                  onOpen={() =>
                    setActivePractice({ week: currentWeek.week_number, practice: p })
                  }
                  onComplete={() =>
                    !done &&
                    completeMutation.mutate({
                      week: currentWeek.week_number,
                      practice: p,
                    })
                  }
                />
              );
            })}
          </div>

          {/* Technique deep-dive */}
          <div className="mt-6 glass rounded-2xl p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <p className="ritual-eyebrow mb-1.5">Primary technique</p>
                <p className="text-lg md:text-xl font-semibold text-ink-primary">
                  {currentWeek.primary_technique}
                </p>
              </div>
              {currentWeek.recommended_chakras.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Chakras
                  </span>
                  {currentWeek.recommended_chakras.map((c) => (
                    <Link
                      key={c}
                      to={`/chakras/${c}`}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-white/10 text-ink-secondary hover:border-accent-lavender/50 hover:text-ink-primary transition-all"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <p className="text-base md:text-lg text-ink-primary/95 leading-relaxed mt-4">
              {currentWeek.technique_detail}
            </p>
          </div>
        </motion.section>
      )}

      {/* Path map — all weeks */}
      <section className="mt-14 md:mt-16">
        <div className="mb-6">
          <p className="ritual-eyebrow mb-1.5">Timeline</p>
          <h2 className="text-xl md:text-2xl font-semibold text-ink-primary">
            All weeks
          </h2>
          <p className="text-sm text-ink-secondary mt-1.5">
            Expand a week for techniques and daily practices.
          </p>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-amethyst to-accent-rose rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${programProgressPct}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>

        <ol className="space-y-3 md:space-y-4">
          {program?.map((week, idx) => {
            const isCurrent = user?.current_week === week.week_number;
            const isOpen = openWeek === week.week_number;
            const wp = progressByWeek.get(week.week_number);
            const today = wp?.daily_completion_log[todayISO()] ?? [];
            const isPast = (user?.current_week ?? 1) > week.week_number;
            return (
              <WeekRow
                key={week.week_number}
                index={idx}
                week={week}
                isCurrent={isCurrent}
                isPast={isPast}
                isOpen={isOpen}
                completedToday={today}
                onToggle={() =>
                  setOpenWeek(isOpen ? null : week.week_number)
                }
                onSetActive={() => switchWeek.mutate(week.week_number)}
                onPracticeOpen={(practice) =>
                  setActivePractice({ week: week.week_number, practice })
                }
                onPracticeComplete={(practice) =>
                  completeMutation.mutate({
                    week: week.week_number,
                    practice,
                  })
                }
              />
            );
          })}
        </ol>
      </section>

      </div>

      <aside className="hidden lg:block sticky top-24 self-start">
        <PathSummaryAside {...pathAsideProps} />
      </aside>
    </div>

      {/* Practice deep-dive modal */}
      <PracticeDialog
        active={activePractice}
        onClose={() => setActivePractice(null)}
        onComplete={(week, practice) => {
          completeMutation.mutate({ week, practice });
          setActivePractice(null);
        }}
        progressByWeek={progressByWeek}
      />
  </>
  );
}

function PracticeCard({
  index,
  meta,
  done,
  onOpen,
  onComplete,
}: {
  index: number;
  meta: PracticeMeta;
  done: boolean;
  onOpen: () => void;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.04 * index }}
      className={cn(
        "group relative rounded-2xl overflow-hidden transition-all border flex items-stretch min-h-[5.25rem]",
        done
          ? "border-accent-mint/40 bg-accent-mint/[0.06]"
          : "border-white/10 glass hover:border-accent-lavender/40",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 text-left p-5 focus-ring flex items-start gap-4"
      >
        <span
          className={cn(
            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-colors",
            done
              ? "bg-accent-mint/20 text-accent-mint"
              : "bg-white/[0.06] text-accent-lavender group-hover:bg-accent-lavender/15",
          )}
        >
          {done ? "✓" : meta.glyph}
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-lg font-medium text-ink-primary">{meta.label}</h3>
          {meta.duration && (
            <p className="text-xs text-ink-muted mt-1">{meta.duration}</p>
          )}
        </div>
      </button>
      <label
        className="shrink-0 flex items-center px-4 md:px-5 border-l border-white/[0.06] cursor-pointer select-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="w-5 h-5 rounded border-white/25 bg-white/[0.04] text-accent-mint focus:ring-accent-lavender/50 focus:ring-offset-2 focus:ring-offset-void"
          checked={done}
          disabled={done}
          onChange={() => {
            if (!done) onComplete();
          }}
          aria-label={
            done ? `${meta.label} completed today` : `Mark ${meta.label} done today`
          }
        />
      </label>
    </motion.div>
  );
}

function WeekRow({
  index,
  week,
  isCurrent,
  isPast,
  isOpen,
  completedToday,
  onToggle,
  onSetActive,
  onPracticeOpen,
  onPracticeComplete,
}: {
  index: number;
  week: WeeklyProgram;
  isCurrent: boolean;
  isPast: boolean;
  isOpen: boolean;
  completedToday: string[];
  onToggle: () => void;
  onSetActive: () => void;
  onPracticeOpen: (practice: string) => void;
  onPracticeComplete: (practice: string) => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 * index }}
    >
      <Card
        className={cn(
          "!p-0 overflow-hidden transition-all",
          isCurrent &&
            "border-accent-amethyst/40 shadow-[0_0_60px_-25px_rgba(124,92,255,0.7)]",
        )}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-start gap-4 p-5 md:p-6 text-left focus-ring"
        >
          <span
            className={cn(
              "shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl border transition-all",
              isCurrent &&
                "bg-gradient-to-br from-accent-amethyst to-accent-rose text-ink-primary border-transparent shadow-glow",
              !isCurrent && isPast &&
                "bg-accent-mint/10 text-accent-mint border-accent-mint/30",
              !isCurrent && !isPast &&
                "bg-white/[0.04] text-ink-secondary border-white/10",
            )}
          >
            {week.week_number}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                {week.primary_technique}
              </p>
              {isCurrent && (
                <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber border border-accent-amber/30">
                  Active
                </span>
              )}
              {isPast && !isCurrent && (
                <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent-mint/10 text-accent-mint border border-accent-mint/30">
                  Walked
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-medium text-ink-primary mt-1">
              {week.title}
            </h3>
            <p className="text-sm md:text-base text-ink-secondary mt-1.5 leading-snug">
              {week.focus}
            </p>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 text-ink-muted text-lg mt-1"
            aria-hidden
          >
            →
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 md:px-6 pb-6 pt-2 border-t border-white/5 space-y-5">
                <div>
                  <p className="ritual-eyebrow mb-2">Technique</p>
                  <p className="text-base text-ink-primary/95 leading-relaxed">
                    {week.technique_detail}
                  </p>
                </div>

                <div>
                  <p className="ritual-eyebrow mb-3">Daily practices</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {week.daily_practices.map((p) => {
                      const meta = metaFor(p);
                      const done = completedToday.includes(p);
                      return (
                        <li key={p} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onPracticeOpen(p)}
                            className={cn(
                              "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all min-w-0",
                              done
                                ? "border-accent-mint/30 bg-accent-mint/[0.06] text-ink-primary"
                                : "border-white/10 hover:border-accent-lavender/30 hover:bg-white/[0.03]",
                            )}
                          >
                            <span
                              className={cn(
                                "text-base w-5 shrink-0 text-center",
                                done ? "text-accent-mint" : "text-accent-lavender/70",
                              )}
                            >
                              {done ? "✓" : meta.glyph}
                            </span>
                            <span className="text-sm">{meta.label}</span>
                          </button>
                          {isCurrent && (
                            <label
                              className="shrink-0 flex items-center p-2 cursor-pointer select-none"
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-white/25 bg-white/[0.04] text-accent-mint focus:ring-accent-lavender/50 focus:ring-offset-2 focus:ring-offset-void"
                                checked={done}
                                disabled={done}
                                onChange={() => {
                                  if (!done) onPracticeComplete(p);
                                }}
                                aria-label={`Mark ${meta.label} done today`}
                              />
                            </label>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {week.recommended_chakras.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                      Chakras: {week.recommended_chakras.join(" · ")}
                    </p>
                  )}
                  {!isCurrent && (
                    <Button variant="outline" size="sm" onClick={onSetActive}>
                      Set as active
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.li>
  );
}

function PracticeDialog({
  active,
  onClose,
  onComplete,
  progressByWeek,
}: {
  active: { week: number; practice: string } | null;
  onClose: () => void;
  onComplete: (week: number, practice: string) => void;
  progressByWeek: Map<number, { daily_completion_log: Record<string, string[]> }>;
}) {
  if (!active) {
    return (
      <AnimatePresence>{null}</AnimatePresence>
    );
  }
  const meta = metaFor(active.practice);
  const today = progressByWeek.get(active.week)?.daily_completion_log[todayISO()] ?? [];
  const done = today.includes(active.practice);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-void/70 backdrop-blur-md"
        />
        <motion.div
          key="dialog"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[1] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
        >
        <div className="glass-strong rounded-2xl shadow-glow flex flex-col max-h-[85vh] overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl bg-accent-amethyst/15 flex items-center justify-center text-2xl text-accent-lavender">
                {meta.glyph}
              </span>
              <div>
                <p className="ritual-eyebrow mb-0.5">
                  Week {active.week} · {meta.duration}
                </p>
                <h3 className="text-2xl font-semibold text-ink-primary">
                  {meta.label}
                </h3>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto px-6 py-6 space-y-5">
            <p className="text-base text-ink-primary leading-relaxed">
              {meta.description}
            </p>
            {meta.steps.length > 0 && (
              <div>
                <p className="ritual-eyebrow mb-3">Steps</p>
                <ol className="space-y-3">
                  {meta.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full border border-accent-lavender/40 text-accent-lavender flex items-center justify-center text-xs font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <p className="text-base text-ink-primary/90 leading-relaxed pt-0.5">
                        {s}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-white/25 bg-white/[0.04] text-accent-mint focus:ring-accent-lavender/50 focus:ring-offset-2 focus:ring-offset-void"
                checked={done}
                disabled={done}
                onChange={() => {
                  if (!done) onComplete(active.week, active.practice);
                }}
              />
              <span className="text-sm text-ink-secondary">Done today</span>
            </label>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
