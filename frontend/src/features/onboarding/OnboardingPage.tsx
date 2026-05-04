import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { skipOnboarding, submitOnboarding } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractMessage } from "@/api/client";
import { LogoMark, LucivineWordmark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ExperienceLevel, Goal } from "@/api/types";

type Step = 0 | 1 | 2 | 3;

const LEVELS: Array<{
  id: ExperienceLevel;
  title: string;
  blurb: string;
  startWeek: number;
}> = [
  {
    id: "newcomer",
    title: "I'm just starting",
    blurb: "Never recalled a dream, never tried to lucid-dream.",
    startWeek: 1,
  },
  {
    id: "recaller",
    title: "I remember dreams most mornings",
    blurb: "Recall is decent. No lucid dream yet.",
    startWeek: 2,
  },
  {
    id: "dabbler",
    title: "I've had a few lucid dreams",
    blurb: "1–3 lucid dreams ever, mostly by accident.",
    startWeek: 2,
  },
  {
    id: "practitioner",
    title: "I lucid-dream monthly",
    blurb: "I know MILD or WBTB. Want consistency.",
    startWeek: 3,
  },
  {
    id: "adept",
    title: "I lucid-dream weekly+",
    blurb: "Want depth, control, and a real protocol.",
    startWeek: 5,
  },
];

const GOALS: Array<{ id: Goal; label: string }> = [
  { id: "lucidity", label: "Have a lucid dream" },
  { id: "recall", label: "Better dream recall" },
  { id: "nightmares", label: "Reduce nightmares" },
  { id: "creativity", label: "Creative inspiration" },
  { id: "healing", label: "Emotional healing" },
  { id: "meditation", label: "Mindfulness practice" },
  { id: "sleep_quality", label: "Better sleep" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>(0);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bedtime, setBedtime] = useState<string>("23:00");
  const [askPush, setAskPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function next() {
    setStep((s) => (Math.min(3, s + 1) as Step));
  }

  function back() {
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  function toggleGoal(g: Goal) {
    setGoals((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, g];
    });
  }

  async function maybeRequestPush() {
    if (!askPush) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore — non-blocking */
      }
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await maybeRequestPush();
      const updated = await submitOnboarding({
        experience_level: level ?? undefined,
        goals,
        typical_bedtime: bedtime ? `${bedtime}:00` : null,
      });
      setUser(updated);
      navigate("/", { replace: true });
    } catch (e) {
      setError(extractMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    setBusy(true);
    setError(null);
    try {
      const updated = await skipOnboarding();
      setUser(updated);
      navigate("/", { replace: true });
    } catch (e) {
      setError(extractMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const startWeek = level ? LEVELS.find((l) => l.id === level)?.startWeek : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3 text-center mb-10">
          <span className="relative w-12 h-12 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-amethyst via-accent-rose/60 to-accent-azure/40 blur-md opacity-60 animate-breathe" />
            <LogoMark size={36} className="relative" />
          </span>
          <LucivineWordmark className="text-xl text-ink-primary font-medium" />
          <p className="ritual-eyebrow">{`Step ${step + 1} of 4`}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-amethyst to-accent-rose rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/[0.09] bg-black/[0.42] backdrop-blur-lg p-6 md:p-8"
          >
            {step === 0 && (
              <div>
                <h1 className="text-2xl md:text-3xl font-medium text-ink-primary leading-tight">
                  Welcome to <em className="not-italic text-gradient">Lucivine</em>
                </h1>
                <p className="text-sm md:text-base text-ink-secondary mt-3 leading-relaxed">
                  A short walk-through so we can shape the program around you. Four
                  questions, under two minutes — or skip and start at Week 1.
                </p>
                <ul className="mt-5 space-y-2 text-[13px] text-ink-secondary">
                  <li>· Where you are with lucid dreaming</li>
                  <li>· What you want to get out of it</li>
                  <li>· When you usually go to bed</li>
                  <li>· Whether to send gentle nudges</li>
                </ul>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="ritual-eyebrow mb-2">Where are you?</p>
                <h2 className="text-xl md:text-2xl font-medium text-ink-primary">
                  Pick the closest match.
                </h2>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                  We'll start you at the right week — no point repeating ground you've already walked.
                </p>
                <div className="mt-5 space-y-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLevel(l.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-colors focus-ring",
                        level === l.id
                          ? "border-accent-lavender/60 bg-accent-lavender/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-accent-lavender/30 hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[15px] font-medium text-ink-primary">{l.title}</p>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted shrink-0">
                          Start · W{l.startWeek}
                        </span>
                      </div>
                      <p className="text-[13px] text-ink-secondary mt-1 leading-snug">
                        {l.blurb}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="ritual-eyebrow mb-2">What do you want?</p>
                <h2 className="text-xl md:text-2xl font-medium text-ink-primary">
                  Pick up to three.
                </h2>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                  We'll surface this on your program banner. You can change it later in Settings.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {GOALS.map((g) => {
                    const selected = goals.includes(g.id);
                    const disabled = !selected && goals.length >= 3;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGoal(g.id)}
                        disabled={disabled}
                        className={cn(
                          "px-4 py-2 rounded-full border text-[13px] font-medium transition-colors focus-ring",
                          selected
                            ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                            : "border-white/10 bg-white/[0.04] text-ink-secondary hover:border-accent-lavender/30 hover:text-ink-primary",
                          disabled && "opacity-40 cursor-not-allowed hover:border-white/10",
                        )}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-ink-muted mt-4">
                  {goals.length}/3 selected
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="ritual-eyebrow mb-2">Sleep + reminders</p>
                <h2 className="text-xl md:text-2xl font-medium text-ink-primary">
                  When do you usually fall asleep?
                </h2>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                  Used to time WBTB nudges and the evening wind-down — never displayed publicly.
                </p>
                <label className="block mt-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-2 block">
                    Typical bedtime
                  </span>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-md px-4 py-3 text-ink-primary focus:outline-none focus:border-accent-lavender/60"
                  />
                </label>

                <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={askPush}
                    onChange={(e) => setAskPush(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-white/25 bg-white/[0.04] text-accent-mint focus:ring-accent-lavender/50"
                  />
                  <span>
                    <span className="text-[14px] text-ink-primary block">Send me gentle nudges</span>
                    <span className="text-[12px] text-ink-secondary block mt-0.5 leading-snug">
                      Daily push for evening wind-down + your chosen practices. You can change this anytime.
                    </span>
                  </span>
                </label>

                {startWeek && (
                  <div className="mt-6 rounded-xl border border-accent-lavender/20 bg-accent-lavender/[0.04] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                      Your starting point
                    </p>
                    <p className="text-[15px] text-ink-primary mt-1.5">
                      Week {startWeek}{" "}
                      {goals.length > 0 && (
                        <span className="text-ink-muted">
                          · focus: {goals.map((g) => g.replace(/_/g, " ")).join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="mt-4 text-xs text-accent-rose font-mono">{error}</p>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="ghost" onClick={back} disabled={busy}>
                  Back
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={skip}
                  disabled={busy}
                  className="text-xs text-ink-muted hover:text-ink-secondary underline focus-ring"
                >
                  Skip and start at Week 1
                </button>
              )}
              {step < 3 ? (
                <Button
                  onClick={next}
                  disabled={busy || (step === 1 && level === null)}
                >
                  Continue
                </Button>
              ) : (
                <Button onClick={finish} loading={busy}>
                  Begin
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
