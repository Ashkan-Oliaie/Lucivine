import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { fetchDashboard } from "@/api/analytics";
import { useAuthStore } from "@/stores/auth";
import { PracticeTraitsSection, DreamFocusSection } from "@/features/dashboard/PracticeInsights";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  return (
    <div>
      <p className="ritual-eyebrow mb-3">Insights</p>
      <h1 className="font-light text-4xl md:text-6xl leading-[1.05] text-ink-primary">
        Welcome back,
        <br />
        <em className="text-gradient">
          {user?.display_name || "seeker"}
        </em>
        .
      </h1>

      <section className="mt-10 md:mt-14">
        <p className="ritual-eyebrow mb-4">All time</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Stat
            label="Streak"
            value={data?.streak ?? 0}
            suffix="days"
            accent="from-accent-amethyst to-accent-rose"
          />
          <Stat
            label="Lucid"
            value={data?.totals.lucid_dreams ?? 0}
            suffix="dreams"
            accent="from-accent-rose to-accent-amber"
          />
          <Stat
            label="WILD"
            value={data?.totals.wild_successes ?? 0}
            suffix="successes"
            accent="from-accent-azure to-accent-amethyst"
          />
          <Stat
            label="Week"
            value={data?.current_week ?? 1}
            suffix="of six"
            accent="from-accent-mint to-accent-azure"
          />
        </div>
      </section>

      <section className="mt-10 md:mt-14">
        <p className="ritual-eyebrow mb-4">Last 30 days</p>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MiniStat label="Reality checks" value={data?.last_30_days.reality_checks ?? 0} />
          <MiniStat label="Lucid dreams" value={data?.last_30_days.lucid_dreams ?? 0} />
          <MiniStat label="Chakra mins" value={data?.last_30_days.chakra_minutes ?? 0} />
        </div>
      </section>

      <PracticeTraitsSection data={data} />

      <DreamFocusSection />

      <section className="mt-10 md:mt-14">
        <div className="flex items-baseline justify-between mb-4">
          <p className="ritual-eyebrow">Recent lucid dreams</p>
          <Link
            to="/journal?lucid=true"
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-secondary hover:text-ink-primary transition-colors"
          >
            All →
          </Link>
        </div>
        {isLoading ? (
          <Card>
            <p className=" italic text-ink-secondary">Listening…</p>
          </Card>
        ) : data?.recent_lucids.length ? (
          <ul className="space-y-3">
            {data.recent_lucids.map((d, idx) => (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <Link to={`/journal/${d.id}`} className="block">
                  <Card interactive>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className=" text-lg text-ink-primary truncate">
                        {d.title}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted shrink-0 tabular-nums">
                        {d.dream_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-secondary leading-snug">
                      {d.technique_used && <span>{d.technique_used}</span>}
                      {d.vividness != null && (
                        <span>vividness {d.vividness}/10</span>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.li>
            ))}
          </ul>
        ) : (
          <Card>
            <p className=" italic text-ink-secondary">
              No lucid dreams yet. The gate opens when you remember to look.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix: string;
  accent: string;
}) {
  return (
    <div className="relative group glass rounded-2xl p-4 md:p-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div
        className={`absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity`}
      />
      <p className="ritual-eyebrow mb-2 relative">{label}</p>
      <p className=" text-3xl md:text-4xl text-ink-primary leading-none relative">
        {value}
      </p>
      <p className=" italic text-xs md:text-sm text-ink-secondary mt-1 relative">
        {suffix}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 md:p-4">
      <p className=" text-2xl md:text-3xl text-ink-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mt-1">
        {label}
      </p>
    </div>
  );
}
