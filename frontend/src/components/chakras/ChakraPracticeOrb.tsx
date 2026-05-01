import { motion } from "framer-motion";
import { ChakraGlyph } from "@/components/chakras/ChakraGlyph";
import type { ChakraId } from "@/api/types";

type Phase = "idle" | "running" | "paused";

type Props = {
  chakraId: ChakraId;
  accent: string;
  phase: Phase;
  orbDigits: string;
  caption: string;
};

/** Proportional orb: glyph ~26% of diameter, timer scales with orb (clamp). */
export function ChakraPracticeOrb({
  chakraId,
  accent,
  phase,
  orbDigits,
  caption,
}: Props) {
  const running = phase === "running";
  const orbIdle = !running;

  return (
    <div className="flex justify-center w-full min-w-0">
      <motion.div
        className="relative aspect-square w-[min(78vw,17rem)] sm:w-[min(82vw,20rem)] md:w-[min(62vw,26rem)] lg:w-[min(52vw,28rem)] xl:w-[min(44vw,32rem)]"
        animate={running ? { scale: [1, 1.012, 1] } : { scale: 1 }}
        transition={{
          duration: 10,
          repeat: running ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Outer ambient wash */}
        <motion.div
          className="absolute -inset-[12%] rounded-full blur-[2.75rem] opacity-[0.55] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 38% 28%, ${accent}aa, ${accent}40 42%, transparent 68%)`,
          }}
          animate={
            running
              ? { scale: [1, 1.06, 1], opacity: [0.5, 0.68, 0.5] }
              : { scale: 1, opacity: 0.38 }
          }
          transition={{
            duration: running ? 7.5 : 0.4,
            repeat: running ? Infinity : 0,
            ease: "easeInOut",
          }}
        />

        {/* Soft rim light */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none opacity-90"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.14) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.12) 100%)`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -1px 0 rgba(0,0,0,0.2),
              0 0 0 1px ${accent}33
            `,
          }}
        />

        <svg className="absolute inset-[6%] w-[88%] h-[88%] left-[6%] top-[6%] opacity-[0.28]" aria-hidden>
          {[...Array(12)].map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const rr = 40 + (i % 3) * 3.2;
            const cx = 50 + Math.cos(a) * rr;
            const cy = 50 + Math.sin(a) * rr;
            return (
              <circle
                key={i}
                cx={`${cx}%`}
                cy={`${cy}%`}
                r={1}
                fill={accent}
                opacity={0.45 + (i % 5) * 0.07}
              />
            );
          })}
        </svg>

        <motion.div
          className="absolute inset-[5%] rounded-full border border-dashed opacity-[0.32]"
          style={{ borderColor: `${accent}99` }}
          animate={{ rotate: orbIdle ? 0 : 360 }}
          transition={{
            duration: 44,
            repeat: orbIdle ? 0 : Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-[11%] rounded-full border opacity-[0.22]"
          style={{ borderColor: accent }}
          animate={{ rotate: orbIdle ? 0 : -360 }}
          transition={{
            duration: 68,
            repeat: orbIdle ? 0 : Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          animate={running ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{
            duration: 7.5,
            repeat: running ? Infinity : 0,
            ease: "easeInOut",
          }}
          className="absolute inset-[16%] rounded-full"
          style={{
            background: `radial-gradient(circle at 36% 28%, ${accent}aa, ${accent}38 48%, transparent 76%)`,
            boxShadow: `0 0 64px -14px ${accent}`,
          }}
        />
        <div
          className="absolute inset-[24%] rounded-full opacity-50 blur-[1.15rem]"
          style={{ background: accent }}
        />

        {/* Center stack: glyph + time — proportions locked to orb width */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-[12%] pt-[10%] pb-[11%]">
          <div
            className="flex items-center justify-center shrink-0 mb-[6%]"
            style={{ width: "34%", aspectRatio: "1" }}
          >
            <ChakraGlyph
              id={chakraId}
              color="#fdfcff"
              className="w-full h-full max-w-[4.75rem] drop-shadow-[0_0_20px_rgba(255,255,255,0.22)]"
            />
          </div>
          <div className="font-semibold text-ink-primary tabular-nums tracking-tight leading-none drop-shadow-md w-full text-center text-[clamp(1.625rem,6vmin,2.625rem)]">
            {orbDigits}
          </div>
          <p className="mt-[5%] text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-ink-muted/95">
            {caption}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
