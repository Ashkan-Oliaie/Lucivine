import type { CSSProperties } from "react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useDocumentVisible } from "@/hooks/useDocumentVisible";

type Props = {
  accent?: string;
  /** Stable seed so each chakra gets unique aurora hot-spots & morph timings */
  seedKey?: string;
  /** Practice running — aurora expands outward and intensifies */
  intense?: boolean;
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rnd(seed: number, i: number): number {
  const x = Math.sin(seed * 0.001127 + i * 78.233 + (seed % 9973)) * 10000;
  return x - Math.floor(x);
}

/**
 * Unified aurora cloud anchored behind the orb.
 *
 * The visual is composed from a few concentric, heavily-blurred discs whose radial
 * gradients overlap to read as ONE continuous glowing cloud — not separate sparks.
 * Each layer breathes + slowly rotates so gradient hot-spots drift across the orb,
 * producing a morphing aurora.
 *
 * Idle ↔ running uses pure CSS transitions on size/opacity, so toggling never
 * resets the underlying keyframe animations — they keep flowing through the change.
 */
export function ChakraPracticeClouds({ accent, intense, seedKey }: Props) {
  const tabVisible = useDocumentVisible();
  const seed = useMemo(
    () => hashString(seedKey ?? accent ?? "chakra"),
    [seedKey, accent],
  );

  const wash = accent ?? "rgba(124, 92, 255, 0.7)";
  const secondary = accent ? `${accent}aa` : "rgba(255, 137, 184, 0.55)";
  const tertiary = accent ? `${accent}66` : "rgba(125, 197, 255, 0.45)";
  const faint = accent ? `${accent}33` : "rgba(124, 92, 255, 0.18)";

  /* Seeded hot-spot positions so each chakra's aurora has unique highlights.
   * Wider spread (10–90% of layer box) so the cloud reads as broad, irregular
   * aurora rather than a tight halo around the orb. */
  const spots = useMemo(() => {
    return [0, 1, 2, 3, 4].map((i) => ({
      x1: 10 + rnd(seed, i * 7 + 3) * 80,
      y1: 12 + rnd(seed, i * 11 + 5) * 76,
      x2: 10 + rnd(seed, i * 13 + 7) * 80,
      y2: 12 + rnd(seed, i * 17 + 11) * 76,
      x3: 10 + rnd(seed, i * 19 + 13) * 80,
      y3: 12 + rnd(seed, i * 23 + 17) * 76,
    }));
  }, [seed]);

  /* Seeded animation timings so chakras don't pulse in lockstep */
  const t = useMemo(() => {
    return {
      breathInner: 9 + rnd(seed, 41) * 4,
      breathMid: 13 + rnd(seed, 43) * 5,
      breathOuter: 17 + rnd(seed, 47) * 6,
      rotInner: 60 + rnd(seed, 53) * 30,
      rotMid: 110 + rnd(seed, 59) * 40,
      rotOuter: 180 + rnd(seed, 61) * 60,
      morph: 22 + rnd(seed, 67) * 10,
      morphHue: 28 + rnd(seed, 71) * 12,
      delayInner: -(rnd(seed, 73) * 30),
      delayMid: -(rnd(seed, 79) * 40),
      delayOuter: -(rnd(seed, 83) * 50),
      rotInnerDir: rnd(seed, 87) > 0.5 ? 1 : -1,
      rotMidDir: rnd(seed, 91) > 0.5 ? 1 : -1,
      rotOuterDir: rnd(seed, 97) > 0.5 ? 1 : -1,
    };
  }, [seed]);

  const animsPaused = !tabVisible;

  /* Inner core veil — closest to orb, brightest, smallest */
  const innerBg = `
    radial-gradient(circle at ${spots[0].x1}% ${spots[0].y1}%, ${wash}, transparent 58%),
    radial-gradient(circle at ${spots[0].x2}% ${spots[0].y2}%, ${secondary}, transparent 54%),
    radial-gradient(ellipse 60% 50% at 50% 50%, ${tertiary}, transparent 64%)
  `;

  /* Mid veil — broader, softer, blends inner + outer */
  const midBg = `
    radial-gradient(ellipse 55% 45% at ${spots[1].x1}% ${spots[1].y1}%, ${wash}, transparent 60%),
    radial-gradient(ellipse 50% 42% at ${spots[1].x2}% ${spots[1].y2}%, ${secondary}, transparent 58%),
    radial-gradient(ellipse 48% 40% at ${spots[1].x3}% ${spots[1].y3}%, ${tertiary}, transparent 60%),
    radial-gradient(circle at 50% 50%, ${faint}, transparent 70%)
  `;

  /* Outer halo — widest, faintest, gives the aurora its outer feathered edge.
   * Wider ellipses + asymmetric placements so the outer edge is irregular. */
  const outerBg = `
    radial-gradient(ellipse 75% 62% at ${spots[2].x1}% ${spots[2].y1}%, ${secondary}, transparent 64%),
    radial-gradient(ellipse 68% 58% at ${spots[2].x2}% ${spots[2].y2}%, ${tertiary}, transparent 66%),
    radial-gradient(ellipse 62% 54% at ${spots[2].x3}% ${spots[2].y3}%, ${faint}, transparent 66%),
    radial-gradient(ellipse 90% 72% at 50% 50%, ${faint}, transparent 74%)
  `;

  /* Wisp — irregular morphing blob layered on top so the cloud has organic shape change */
  const wispBg = `
    radial-gradient(ellipse 58% 48% at ${spots[3].x1}% ${spots[3].y1}%, ${wash}, transparent 60%),
    radial-gradient(ellipse 54% 44% at ${spots[3].x2}% ${spots[3].y2}%, ${secondary}, transparent 62%),
    radial-gradient(ellipse 50% 40% at ${spots[3].x3}% ${spots[3].y3}%, ${tertiary}, transparent 58%)
  `;

  /* Drift — extra-wide irregular outer wisp at randomized offset, gives the
   * impression the cloud trails off in unique directions per chakra. */
  const driftBg = `
    radial-gradient(ellipse 70% 50% at ${spots[4].x1}% ${spots[4].y1}%, ${tertiary}, transparent 66%),
    radial-gradient(ellipse 64% 46% at ${spots[4].x2}% ${spots[4].y2}%, ${faint}, transparent 68%),
    radial-gradient(ellipse 58% 42% at ${spots[4].x3}% ${spots[4].y3}%, ${secondary}, transparent 64%)
  `;

  const innerVars = {
    "--breath-dur": `${t.breathInner}s`,
    "--breath-delay": `${t.delayInner}s`,
    "--rot-dur": `${t.rotInner}s`,
    "--rot-delay": `${t.delayInner}s`,
    animationDirection: t.rotInnerDir > 0 ? "normal" : "reverse",
  } as CSSProperties;

  const midVars = {
    "--breath-dur": `${t.breathMid}s`,
    "--breath-delay": `${t.delayMid}s`,
    "--rot-dur": `${t.rotMid}s`,
    "--rot-delay": `${t.delayMid}s`,
    animationDirection: t.rotMidDir > 0 ? "normal" : "reverse",
  } as CSSProperties;

  const outerVars = {
    "--breath-dur": `${t.breathOuter}s`,
    "--breath-delay": `${t.delayOuter}s`,
    "--rot-dur": `${t.rotOuter}s`,
    "--rot-delay": `${t.delayOuter}s`,
    animationDirection: t.rotOuterDir > 0 ? "normal" : "reverse",
  } as CSSProperties;

  const wispVars = {
    "--morph-dur": `${t.morph}s`,
    "--morph-delay": `${t.delayMid}s`,
    "--rot-dur": `${t.morphHue}s`,
    "--rot-delay": `${t.delayInner}s`,
    animationDirection: t.rotOuterDir > 0 ? "reverse" : "normal",
  } as CSSProperties;

  const driftVars = {
    "--breath-dur": `${t.breathOuter + 4}s`,
    "--breath-delay": `${t.delayOuter - 7}s`,
    "--rot-dur": `${t.rotOuter + 30}s`,
    "--rot-delay": `${t.delayOuter}s`,
    animationDirection: t.rotInnerDir > 0 ? "reverse" : "normal",
  } as CSSProperties;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-0",
        animsPaused && "aurora-paused",
      )}
      aria-hidden
    >
      {/* Cluster — tracks orb scale via vmin clamps. Idle/running just changes size + intensity
          via CSS transitions; the keyframe animations underneath never reset. */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "transition-[width,height] duration-[2600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          intense
            ? "h-[clamp(28rem,120vmin,72rem)] w-[clamp(28rem,120vmin,72rem)]"
            : "h-[clamp(18rem,80vmin,46rem)] w-[clamp(18rem,80vmin,46rem)]",
          tabVisible &&
            "will-change-[width,height] [&_*]:will-change-[transform,opacity]",
        )}
      >
        {/* Drift — outermost wide wisp, irregular per-chakra offset */}
        <div
          className="absolute -inset-[14%] aurora-breath transition-opacity duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            ...driftVars,
            background: driftBg,
            filter: "blur(72px) saturate(1.1)",
            opacity: intense ? 0.55 : 0.28,
            mixBlendMode: "screen",
          }}
        />

        {/* Outer halo — widest, deepest blur, faintest */}
        <div
          className="absolute inset-0 rounded-full aurora-breath transition-opacity duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            ...outerVars,
            background: outerBg,
            filter: "blur(56px) saturate(1.15)",
            opacity: intense ? 0.85 : 0.4,
          }}
        />

        {/* Mid veil */}
        <div
          className="absolute inset-[8%] rounded-full aurora-breath transition-opacity duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            ...midVars,
            background: midBg,
            filter: "blur(38px) saturate(1.18)",
            opacity: intense ? 0.95 : 0.55,
          }}
        />

        {/* Wisp — morphing organic shape on top of the mid */}
        <div
          className="absolute inset-[14%] aurora-morph transition-opacity duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            ...wispVars,
            background: wispBg,
            filter: "blur(30px) saturate(1.2)",
            opacity: intense ? 0.85 : 0.5,
            mixBlendMode: "screen",
          }}
        />

        {/* Inner core — brightest, tight to orb */}
        <div
          className="absolute inset-[22%] rounded-full aurora-breath transition-opacity duration-[2400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            ...innerVars,
            background: innerBg,
            filter: "blur(26px) saturate(1.25)",
            opacity: intense ? 1 : 0.7,
          }}
        />
      </div>
    </div>
  );
}
