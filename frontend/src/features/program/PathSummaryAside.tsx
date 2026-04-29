import { useId } from "react";

type PathSummaryAsideProps = {
  streak: number;
  lucid: number;
  week: number;
  totalWeeks: number;
  programProgressPct: number;
};

function JourneyRing({ pct }: { pct: number }) {
  const uid = useId().replace(/:/g, "");
  const gid = `path-ring-grad-${uid}`;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[88px] h-[88px] shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c5cff" />
              <stop offset="50%" stopColor="#ff89b8" />
              <stop offset="100%" stopColor="#ffd57a" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-ink-primary">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Journey</p>
        <p className="text-sm text-ink-secondary mt-1 leading-snug">
          Overall progress through the six-week arc.
        </p>
      </div>
    </div>
  );
}

export function PathSummaryAside({
  streak,
  lucid,
  week,
  totalWeeks,
  programProgressPct,
}: PathSummaryAsideProps) {
  return (
    <div className="glass rounded-2xl p-5 md:p-6 border border-white/[0.07] shadow-glow-soft">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-2">The path</p>
      <h2 className="text-lg font-semibold text-ink-primary leading-snug tracking-tight">
        Six weeks · <span className="text-gradient">One threshold</span>
      </h2>
      <p className="text-sm text-ink-secondary mt-3 leading-relaxed">
        Small weekly practices—steady attention until recall and lucidity come easier.
      </p>

      <div className="mt-6 space-y-3">
        <StatRow label="Streak" value={streak} suffix="days" />
        <StatRow label="Lucid dreams" value={lucid} suffix="total" />
        <StatRow label="Active week" value={week} suffix={`of ${totalWeeks}`} />
      </div>

      <div className="mt-7 pt-6 border-t border-white/[0.06]">
        <JourneyRing pct={programProgressPct} />
      </div>
    </div>
  );
}

function StatRow({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</span>
      <span className="text-right">
        <span className="text-2xl font-semibold tabular-nums text-ink-primary">{value}</span>
        <span className="text-xs text-ink-muted ml-1.5">{suffix}</span>
      </span>
    </div>
  );
}
