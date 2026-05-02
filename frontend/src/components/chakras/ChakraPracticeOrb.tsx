import { motion } from "framer-motion";
import { ChakraGlyph } from "@/components/chakras/ChakraGlyph";
import type { ChakraId } from "@/api/types";
import { cn } from "@/lib/cn";

type Phase = "idle" | "running" | "paused";

type Props = {
  chakraId: ChakraId;
  accent: string;
  phase: Phase;
  orbDigits: string;
  caption: string;
  /** When provided, the orb becomes clickable (used as the "begin" affordance on idle) */
  onActivate?: () => void;
  activateLabel?: string;
};

/** Proportional orb: glyph ~26% of diameter, timer scales with orb (clamp).
 *  Diameter uses vmin so the orb shrinks on short viewports and stays in screen height. */
export function ChakraPracticeOrb({
  chakraId,
  accent,
  phase,
  orbDigits,
  caption,
  onActivate,
  activateLabel,
}: Props) {
  const running = phase === "running";
  const orbIdle = !running;
  const clickable = Boolean(onActivate);

  return (
    <div className="flex justify-center w-full min-w-0">
      <motion.div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? activateLabel : undefined}
        onClick={onActivate}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onActivate?.();
                }
              }
            : undefined
        }
        whileHover={clickable ? { scale: 1.015 } : undefined}
        whileTap={clickable ? { scale: 0.985 } : undefined}
        className={cn(
          "relative aspect-square select-none",
          // Diameter capped by vmin so it stays visible on short viewports + scales nicely on large screens
          "w-[clamp(13rem,52vmin,28rem)] xl:w-[clamp(14rem,46vmin,30rem)]",
          clickable &&
            "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/60 focus-visible:ring-offset-4 focus-visible:ring-offset-void rounded-full",
        )}
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
              : { scale: [1, 1.025, 1], opacity: [0.36, 0.46, 0.36] }
          }
          transition={{
            duration: running ? 7.5 : 9.5,
            repeat: Infinity,
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

        <svg className="absolute inset-[6%] w-[88%] h-[88%] left-[6%] top-[6%] opacity-[0.28] pointer-events-none" aria-hidden>
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
          className="absolute inset-[5%] rounded-full border border-dashed opacity-[0.32] pointer-events-none"
          style={{ borderColor: `${accent}99` }}
          animate={{ rotate: orbIdle ? 360 : 360 }}
          transition={{
            duration: orbIdle ? 90 : 44,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-[11%] rounded-full border opacity-[0.22] pointer-events-none"
          style={{ borderColor: accent }}
          animate={{ rotate: orbIdle ? -360 : -360 }}
          transition={{
            duration: orbIdle ? 130 : 68,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <motion.div
          animate={running ? { scale: [1, 1.1, 1] } : { scale: [1, 1.04, 1] }}
          transition={{
            duration: running ? 7.5 : 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-[16%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 36% 28%, ${accent}aa, ${accent}38 48%, transparent 76%)`,
            boxShadow: `0 0 64px -14px ${accent}`,
          }}
        />
        <div
          className="absolute inset-[24%] rounded-full opacity-50 blur-[1.15rem] pointer-events-none"
          style={{ background: accent }}
        />

        {/* Center stack: glyph + time — proportions locked to orb width */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-[12%] pt-[10%] pb-[11%] pointer-events-none">
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
          <div className="font-semibold text-ink-primary tabular-nums tracking-tight leading-none drop-shadow-md w-full text-center text-[clamp(1.5rem,5.4vmin,2.5rem)]">
            {orbDigits}
          </div>
          <p className="mt-[5%] text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-ink-muted/95">
            {caption}
          </p>
          {clickable && (
            <p className="mt-[3%] text-[10px] uppercase tracking-[0.18em] text-accent-lavender/80">
              {activateLabel ?? "tap to begin"}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
