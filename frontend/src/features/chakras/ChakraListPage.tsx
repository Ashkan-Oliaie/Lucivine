import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchChakras, fetchChakraStats } from "@/api/meditation";
import { ChakraGlyph } from "@/components/chakras/ChakraGlyph";
import { ChakraPracticeClouds } from "@/components/visuals/ChakraPracticeClouds";

export default function ChakraListPage() {
  const { data: chakras } = useQuery({
    queryKey: ["chakras"],
    queryFn: fetchChakras,
    staleTime: 60 * 60_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["chakra-stats"],
    queryFn: fetchChakraStats,
  });

  const minutesByChakra = new Map(
    stats?.per_chakra.map((p) => [p.chakra_id, Math.round(p.seconds / 60)]) ?? [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full pb-2"
    >
      {/* Background wash only — no framed scroll region */}
      <ChakraPracticeClouds />

      <div className="relative z-[1] mb-4">
        <Link
          to="/chakras/root"
          className="text-sm text-accent-lavender hover:underline font-medium"
        >
          ← Back to chakra practice
        </Link>
      </div>

      <ul className="relative z-[1]">
        {chakras?.map((c, i) => {
          const minutes = minutesByChakra.get(c.id) ?? 0;
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.035, 0.28) }}
            >
              <Link
                to={`/chakras/${c.id}`}
                className="group flex items-start gap-3 py-2.5 md:py-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/40 rounded-md"
              >
                <div className="relative shrink-0 mt-0.5">
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-20 blur-md scale-105"
                    style={{ background: c.color }}
                    animate={{ opacity: [0.15, 0.28, 0.15] }}
                    transition={{ duration: 4 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div
                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.05]"
                    style={
                      {
                        background: `radial-gradient(circle at 35% 30%, ${c.color}77, ${c.color}22 60%, transparent 82%)`,
                      } as CSSProperties
                    }
                  >
                    <ChakraGlyph
                      id={c.id}
                      color="#f8f7fc"
                      className="relative z-[1] w-[1.375rem] h-[1.375rem] md:w-6 md:h-6 drop-shadow-[0_0_6px_rgba(255,255,255,0.22)]"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[13px] md:text-sm font-semibold leading-snug text-ink-primary">
                    {c.english}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-ink-muted mt-0.5 leading-snug">
                    {c.name}
                    <span className="text-ink-secondary/85"> · {c.mantra}</span>
                    <span className="text-ink-muted"> · {c.frequency_hz} Hz</span>
                  </p>
                  <p className="text-[9px] uppercase tracking-wide text-ink-muted/80 mt-1 tabular-nums">
                    {minutes} min logged
                  </p>
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
