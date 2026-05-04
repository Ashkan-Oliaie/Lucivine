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
        {/* Column of light — vertical chakra-spectrum line behind the glyph stack */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-3 bottom-3 left-[1.875rem] md:left-[2rem] w-px -translate-x-1/2 opacity-40"
          style={{
            background:
              "linear-gradient(to bottom, #e74c3c 0%, #ff8c42 16%, #ffd93d 32%, #3ddc97 48%, #4ab5ff 64%, #7c5cff 80%, #d6b3ff 100%)",
          }}
        />
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
                className="group relative flex items-start gap-3 py-2.5 md:py-3 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/40 rounded-md"
              >
                <div className="relative shrink-0 mt-0.5">
                  {/* Breathing tinted halo behind the glyph */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full blur-[14px] scale-[1.6] motion-safe:animate-[nebula-pulse_6s_ease-in-out_infinite]"
                    style={
                      {
                        background: `radial-gradient(circle at 50% 50%, ${c.color}aa, ${c.color}33 50%, transparent 75%)`,
                        animationDelay: `${i * 0.4}s`,
                      } as CSSProperties
                    }
                  />
                  <div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.06]"
                    style={
                      {
                        background: `radial-gradient(circle at 35% 30%, ${c.color}55, ${c.color}10 60%, transparent 82%)`,
                        boxShadow: `0 0 22px -4px ${c.color}80, inset 0 0 20px -10px ${c.color}aa`,
                      } as CSSProperties
                    }
                  >
                    <ChakraGlyph
                      id={c.id}
                      color="#f8f7fc"
                      accent={c.color}
                      animated
                      className="relative z-[1] w-9 h-9 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.28)]"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 md:pt-2">
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
