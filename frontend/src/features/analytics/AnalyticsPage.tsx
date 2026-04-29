import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import {
  fetchDashboard,
  fetchHeatmap,
  fetchTimeline,
} from "@/api/analytics";
import { fetchJournalStats } from "@/api/journal";
import { fetchChakraStats, fetchChakras } from "@/api/meditation";
import type { ChakraId, TimelineMetric } from "@/api/types";
import { chakraBalanceRows, derivePracticeTraits } from "@/lib/insights";
import { cn } from "@/lib/cn";

const METRICS: { id: TimelineMetric; label: string }[] = [
  { id: "lucid_count", label: "Lucid dreams" },
  { id: "rc_count", label: "Reality checks" },
  { id: "chakra_minutes", label: "Chakra minutes" },
];

const TECHNIQUE_COLORS = [
  "#6c5ce7",
  "#a29bfe",
  "#74b9ff",
  "#ffeaa7",
  "#fd79a8",
  "#27ae60",
];

export default function AnalyticsPage() {
  const [metric, setMetric] = useState<TimelineMetric>("lucid_count");
  const [year] = useState(new Date().getFullYear());

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
  const { data: timeline } = useQuery({
    queryKey: ["timeline", metric],
    queryFn: () => fetchTimeline(metric, "30d"),
  });
  const { data: heatmap } = useQuery({
    queryKey: ["heatmap", year],
    queryFn: () => fetchHeatmap(year),
  });
  const { data: journalStats } = useQuery({
    queryKey: ["journal-stats"],
    queryFn: fetchJournalStats,
  });
  const { data: chakraStats } = useQuery({
    queryKey: ["chakra-stats"],
    queryFn: fetchChakraStats,
    staleTime: 60_000,
  });
  const { data: chakrasList } = useQuery({
    queryKey: ["chakras"],
    queryFn: fetchChakras,
    staleTime: 60 * 60_000,
  });

  const chakraLabelMap = useMemo(() => {
    const m: Partial<Record<ChakraId, string>> = {};
    chakrasList?.forEach((c) => {
      m[c.id] = c.english;
    });
    return m;
  }, [chakrasList]);

  const chakraRows = useMemo(
    () => chakraBalanceRows(chakraStats?.per_chakra ?? [], chakraLabelMap),
    [chakraStats, chakraLabelMap],
  );

  const chakraPieData = useMemo(() => {
    if (!chakraStats?.per_chakra?.length) return [];
    return chakraStats.per_chakra
      .map((p) => ({
        id: p.chakra_id,
        name: chakraLabelMap[p.chakra_id] ?? String(p.chakra_id),
        value: Math.max(0, p.seconds),
        fill:
          chakrasList?.find((c) => c.id === p.chakra_id)?.color ?? "#a29bfe",
      }))
      .filter((d) => d.value > 0);
  }, [chakraStats, chakraLabelMap, chakrasList]);

  const techniquePie = Object.entries(journalStats?.by_technique ?? {}).map(
    ([name, value]) => ({ name, value: value as number }),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="ritual-eyebrow mb-3">Analytics</p>
      <h1 className="text-4xl md:text-5xl font-light text-ink-primary leading-tight">
        The shape of your <em className="text-accent-lavender">practice</em>.
      </h1>

      {dashboard && (
        <div className="flex flex-wrap gap-2 mt-6 max-w-3xl">
          {derivePracticeTraits(dashboard).map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-ink-secondary leading-snug"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-12">
        <Tile label="Streak" value={dashboard?.streak ?? 0} />
        <Tile label="Lucid total" value={dashboard?.totals.lucid_dreams ?? 0} />
        <Tile label="WILD" value={dashboard?.totals.wild_successes ?? 0} />
        <Tile
          label="Chakra hrs"
          value={Math.round((dashboard?.totals.chakra_seconds ?? 0) / 360) / 10}
        />
      </div>

      <section className="mt-12">
        <p className="ritual-eyebrow mb-2">Chakra balance</p>
        <p className="text-sm text-ink-secondary max-w-2xl leading-relaxed mb-6">
          Share of your total chakra sitting time per center. Strong (about one fifth or more of your
          logged minutes) suggests that channel is flowing; underfed (small slice once you have real
          volume overall) is an invitation to sit there more often—not a flaw.
        </p>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <Card>
            {chakraRows.length === 0 ? (
              <p className="text-sm text-ink-muted italic leading-relaxed">
                Log timed sits from Chakra practice to see balance here.
              </p>
            ) : (
              <ul className="space-y-5">
                {chakraRows.map((row) => (
                  <li key={row.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink-primary font-medium">{row.label}</span>
                      <span className="text-ink-muted tabular-nums shrink-0">
                        {row.minutes} min · {(row.pctOfTotal * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-colors",
                          row.band === "strong" && "bg-accent-mint/75",
                          row.band === "steady" && "bg-accent-amethyst/55",
                          row.band === "underfed" && "bg-accent-amber/65",
                        )}
                        style={{ width: `${Math.min(100, row.pctOfTotal * 100)}%` }}
                      />
                    </div>
                    {row.band === "underfed" && (
                      <p className="text-[11px] text-accent-amber/95 mt-2 leading-snug">
                        Light volume — consider short sits or mantra passes this week.
                      </p>
                    )}
                    {row.band === "strong" && (
                      <p className="text-[11px] text-accent-mint/90 mt-2 leading-snug">
                        Showing up strongly here lately.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-4">
              Practice mix (time share)
            </p>
            {chakraPieData.length === 0 ? (
              <p className="text-sm text-ink-muted italic leading-relaxed">
                Once you log chakra sits, each center appears in its chakra color — slice size matches
                share of total practice time.
              </p>
            ) : (
              <div className="h-64 md:h-72 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chakraPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={92}
                      paddingAngle={2}
                      labelLine={false}
                      label={({ percent }) =>
                        `${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {chakraPieData.map((entry) => (
                        <Cell key={entry.id} fill={entry.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `${(value / 60).toFixed(1)} min`,
                        "Logged",
                      ]}
                      contentStyle={{
                        background: "rgba(18,16,28,0.95)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Last 30 days
          </p>
          <div className="flex gap-2 flex-wrap justify-end">
            {METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors",
                  metric === m.id
                    ? "bg-accent-amethyst/20 text-ink-primary"
                    : "text-ink-muted hover:text-ink-secondary",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <Card>
          <div className="h-56 md:h-72 -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline?.points ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a29bfe" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#a29bfe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#6c5b8e"
                  tick={{ fontSize: 10, fontFamily: "Inter, system-ui, sans-serif" }}
                  tickFormatter={(s) => s.slice(5)}
                />
                <YAxis
                  stroke="#6c5b8e"
                  tick={{ fontSize: 10, fontFamily: "Inter, system-ui, sans-serif" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0518",
                    border: "1px solid #ffffff20",
                    borderRadius: 6,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a29bfe"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {techniquePie.length > 0 && (
        <section className="mt-12">
          <p className="ritual-eyebrow mb-4">Technique breakdown</p>
          <Card>
            <div className="h-56 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={techniquePie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {techniquePie.map((_, i) => (
                      <Cell
                        key={i}
                        fill={TECHNIQUE_COLORS[i % TECHNIQUE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0a0518",
                      border: "1px solid #ffffff20",
                      borderRadius: 6,
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {techniquePie.map((t, i) => (
                <span
                  key={t.name}
                  className="text-[11px] font-medium text-ink-secondary flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: TECHNIQUE_COLORS[i % TECHNIQUE_COLORS.length],
                    }}
                  />
                  {t.name} · {t.value}
                </span>
              ))}
            </div>
          </Card>
        </section>
      )}

      <section className="mt-12">
        <p className="ritual-eyebrow mb-4">{year} activity</p>
        <Card>
          <Heatmap days={heatmap?.days ?? []} year={year} />
        </Card>
      </section>
    </motion.div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-4">
      <p className=" text-3xl text-ink-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted mt-1">
        {label}
      </p>
    </div>
  );
}

function Heatmap({
  days,
  year,
}: {
  days: Array<{ date: string; reality_checks: number; chakra_sessions: number; dream_entries: number; lucid_dreams: number }>;
  year: number;
}) {
  // Build a complete year grid: 53 cols × 7 rows
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  const dataByDate = new Map(days.map((d) => [d.date, d]));
  const cells: Array<{ date: string; intensity: number; total: number; isLucid: boolean } | null> = [];
  // Pad before Jan 1 to align week-of-year columns
  for (let i = 0; i < start.getDay(); i++) cells.push(null);
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const d = dataByDate.get(key);
    const total =
      (d?.reality_checks ?? 0) +
      (d?.chakra_sessions ?? 0) +
      (d?.dream_entries ?? 0);
    cells.push({
      date: key,
      total,
      intensity: Math.min(4, total),
      isLucid: (d?.lucid_dreams ?? 0) > 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Group into weeks (columns of 7)
  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex gap-[2px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((cell, di) => {
              if (!cell) return <div key={di} className="w-2.5 h-2.5" />;
              const opacity = 0.15 + (cell.intensity / 4) * 0.85;
              return (
                <div
                  key={di}
                  title={`${cell.date} · ${cell.total} entries${cell.isLucid ? " · lucid" : ""}`}
                  className={cn(
                    "w-2.5 h-2.5 rounded-sm",
                    cell.isLucid && "ring-1 ring-accent-amber",
                  )}
                  style={{
                    background:
                      cell.intensity > 0
                        ? `rgba(162, 155, 254, ${opacity})`
                        : "rgba(255,255,255,0.03)",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        <span>less</span>
        {[0.15, 0.4, 0.65, 0.9, 1].map((o, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: `rgba(162, 155, 254, ${o})` }}
          />
        ))}
        <span>more</span>
        <span className="ml-4 inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm ring-1 ring-accent-amber bg-accent-amethyst/30" />
          lucid
        </span>
      </div>
    </div>
  );
}
