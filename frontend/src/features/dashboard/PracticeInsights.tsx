import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { Dashboard } from "@/api/types";
import {
  DREAM_FOCUS_GOALS,
  FOCUS_STORAGE_KEY,
  derivePracticeTraits,
  type DreamFocusId,
} from "@/lib/insights";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

export function PracticeTraitsSection({ data }: { data: Dashboard | undefined }) {
  const traits = data ? derivePracticeTraits(data) : [];

  return (
    <section className="mt-10 md:mt-14">
      <p className="ritual-eyebrow mb-4">Traits from your practice</p>
      <div className="flex flex-wrap gap-2">
        {traits.map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-ink-secondary leading-snug max-w-[340px]"
          >
            {t}
          </span>
        ))}
      </div>
      {!data && (
        <p className="text-sm text-ink-muted mt-3 italic">Loading patterns…</p>
      )}
    </section>
  );
}

export function DreamFocusSection() {
  const [focus, setFocus] = useState<DreamFocusId | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOCUS_STORAGE_KEY) as DreamFocusId | null;
      if (raw && DREAM_FOCUS_GOALS.some((g) => g.id === raw)) setFocus(raw);
    } catch {
      /* ignore */
    }
  }, []);

  function select(id: DreamFocusId) {
    setFocus(id);
    try {
      localStorage.setItem(FOCUS_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  const active = DREAM_FOCUS_GOALS.find((g) => g.id === focus);

  return (
    <section className="mt-10 md:mt-14">
      <p className="ritual-eyebrow mb-2">Dream skill focus</p>
      <p className="text-sm text-ink-secondary max-w-xl leading-relaxed">
        Choose what you want to train. We surface anchors here—your six-week program still lives on{" "}
        <Link to="/" className="text-accent-lavender hover:underline">
          Program
        </Link>
        .
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-5">
        {DREAM_FOCUS_GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => select(g.id)}
            className={cn(
              "rounded-xl border px-3 py-3 text-left transition-colors",
              focus === g.id
                ? "border-accent-amethyst/45 bg-accent-amethyst/12 text-ink-primary"
                : "border-white/[0.08] bg-white/[0.02] text-ink-secondary hover:border-white/15 hover:bg-white/[0.04]",
            )}
          >
            <span className="block text-sm font-medium text-ink-primary">{g.label}</span>
            <span className="block text-xs text-ink-muted mt-1 leading-snug">{g.hint}</span>
          </button>
        ))}
      </div>

      {active && (
        <Card className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-3">
            Suggested anchors — {active.label}
          </p>
          <ul className="space-y-2 text-sm text-ink-secondary leading-relaxed">
            {active.anchors.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="text-accent-lavender shrink-0">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link to="/" className="text-accent-lavender hover:underline">
              Weekly program →
            </Link>
            <Link to="/chakras/root" className="text-accent-lavender hover:underline">
              Chakra sits →
            </Link>
            <Link to="/journal/new" className="text-accent-lavender hover:underline">
              New journal →
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
