import type { CSSProperties } from "react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useDocumentVisible } from "@/hooks/useDocumentVisible";

type Props = {
  accent?: string;
  /** Stable seed for pseudo-random blob placement per chakra */
  seedKey?: string;
  /** Practice running — fog spreads & wanders more chaotically */
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

/** Deterministic 0..1 from seed index */
function rnd(seed: number, i: number): number {
  const x = Math.sin(seed * 0.001127 + i * 78.233 + seed % 9973) * 10000;
  return x - Math.floor(x);
}

/** Orbital radius: vmin scales badly on ultrawide — clamp with a seeded px ceiling */
function orbitRadiusCss(seed: number, blobIndex: number): string {
  const vminShare = 8 + rnd(seed, blobIndex * 41 + 3) * 13;
  const pxCap = 148 + rnd(seed, blobIndex * 89 + 13) * 108;
  return `min(${vminShare.toFixed(2)}vmin, ${Math.round(pxCap)}px)`;
}

/** Organic silhouette — seeded supersellipse-ish radius so blobs aren't identical lumps */
function blobRadiusCss(seed: number, blobIndex: number): string {
  const a = 42 + rnd(seed, blobIndex * 101 + 17) * 18;
  const b = 42 + rnd(seed, blobIndex * 103 + 19) * 18;
  const c = 42 + rnd(seed, blobIndex * 107 + 23) * 18;
  const d = 42 + rnd(seed, blobIndex * 109 + 29) * 18;
  return `${a}% ${100 - a}% ${100 - b}% ${b}% / ${c}% ${d}% ${100 - d}% ${100 - c}%`;
}

/** Radial focal points vary per chakra so gradients don't mirror the same smear */
function blobLayers(seed: number, idx: number, wash: string, secondary: string, tertiary: string): string {
  const x1 = 34 + rnd(seed, idx * 2 + 1) * 32;
  const y1 = 32 + rnd(seed, idx * 3 + 2) * 36;
  const x2 = 34 + rnd(seed, idx * 5 + 3) * 32;
  const y2 = 32 + rnd(seed, idx * 7 + 5) * 36;
  switch (idx) {
    case 1:
      return `radial-gradient(circle at ${x1}% ${y1}%, ${wash}, transparent 61%), radial-gradient(circle at ${x2}% ${y2}%, ${secondary}, transparent 57%)`;
    case 2:
      return `radial-gradient(ellipse ${52 + rnd(seed, 11) * 30}% ${44 + rnd(seed, 13) * 28}% at ${42 + rnd(seed, 15) * 16}% ${46 + rnd(seed, 17) * 14}%, ${tertiary}, transparent 59%)`;
    case 3:
      return `radial-gradient(circle at ${x1}% ${y1}%, ${wash}, transparent 59%), radial-gradient(circle at ${100 - x2}% ${100 - y2}%, rgba(255,137,184,0.24), transparent 55%)`;
    default:
      return `radial-gradient(circle at ${x2}% ${y2}%, ${secondary}, transparent 58%), radial-gradient(ellipse ${56 + rnd(seed, 19) * 26}% ${48 + rnd(seed, 21) * 28}% at ${48 + rnd(seed, 23) * 12}% ${52 + rnd(seed, 25) * 12}%, ${tertiary}, transparent 57%)`;
  }
}

/** Orbital timings — seeded per blob */
function orbitParams(seed: number, blobIndex: number) {
  const orbitDur = 56 + rnd(seed, blobIndex * 47 + 11) * 52;
  const orbitDelay = -(rnd(seed, blobIndex * 53 + 17) * orbitDur);
  const breathDur = 13 + rnd(seed, blobIndex * 59 + 19) * 14;
  const breathDelay = -(rnd(seed, blobIndex * 61 + 23) * breathDur);
  const frozenAngle = rnd(seed, blobIndex * 71 + 29) * 360;
  return {
    orbitDur,
    orbitDelay,
    breathDur,
    breathDelay,
    frozenAngle,
  };
}

const VEIL_MS = "2600ms";
const VEIL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Idle: faint veil + small blobs near center.
 * Running (intense): crossfaded veil + larger blobs; sparks orbit + directional breath (globals.css).
 */
export function ChakraPracticeClouds({ accent, intense, seedKey }: Props) {
  const tabVisible = useDocumentVisible();
  const seed = useMemo(() => hashString(seedKey ?? accent ?? "chakra"), [seedKey, accent]);

  const wash = accent ?? "rgba(72, 52, 140, 0.72)";
  const secondary = accent ? `${accent}aa` : "rgba(140, 70, 110, 0.42)";
  const tertiary = accent ? `${accent}77` : "rgba(70, 110, 160, 0.38)";

  const idleCenterStyle: CSSProperties = {
    background: `
      radial-gradient(ellipse 58% 52% at 50% 50%, rgba(124, 92, 255, 0.055), transparent 66%),
      radial-gradient(ellipse 46% 42% at 50% 50%, ${wash}, transparent 64%),
      radial-gradient(ellipse 62% 58% at 50% 50%, rgba(62, 42, 120, 0.04), transparent 70%)
    `,
  };

  /* Ring around orb — lighter washes so sparks read as the main motion */
  const spreadBaseStyle: CSSProperties = {
    background: `
      radial-gradient(ellipse 72% 62% at 50% 50%, rgba(124, 92, 255, 0.055), transparent 60%),
      radial-gradient(ellipse 34% 30% at 50% 50%, ${wash}, transparent 60%),
      radial-gradient(ellipse 44% 38% at 26% 56%, ${wash}, transparent 56%),
      radial-gradient(ellipse 44% 38% at 74% 54%, ${secondary}, transparent 56%),
      radial-gradient(ellipse 42% 36% at 50% 76%, ${tertiary}, transparent 54%),
      radial-gradient(ellipse 38% 32% at 50% 26%, rgba(124, 92, 255, 0.035), transparent 56%),
      radial-gradient(ellipse 34% 40% at 21% 42%, ${secondary}, transparent 54%),
      radial-gradient(ellipse 34% 40% at 79% 44%, ${wash}, transparent 54%)
    `,
  };

  const blobs = useMemo(
    () =>
      [1, 2, 3, 4].map((i) => ({
        i,
        bg: blobLayers(seed, i, wash, secondary, tertiary),
      })),
    [seed, wash, secondary, tertiary],
  );

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 min-h-[100dvh] w-full overflow-visible",
        "[contain:layout]",
        !tabVisible && "chakra-fog-paused",
      )}
      aria-hidden
    >
      {/* Dual veil crossfade — avoids snapping gradient swap on begin / resume */}
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        <div
          className="pointer-events-none absolute inset-0 blur-[34px] saturate-[1.06] lg:blur-[26px] xl:blur-[22px]"
          style={{
            opacity: intense ? 0 : 1,
            transition: `opacity ${VEIL_MS} ${VEIL_EASE}`,
            ...idleCenterStyle,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 blur-[38px] sm:blur-[42px] saturate-[1.06] lg:blur-[30px] xl:blur-[26px]"
          style={{
            opacity: intense ? 1 : 0,
            transition: `opacity ${VEIL_MS} ${VEIL_EASE}`,
            ...spreadBaseStyle,
          }}
        />
      </div>

      {/* Sparks orbit viewport center (aligned with practice orb); breath scales squash/stretch */}
      {blobs.map(({ bg, i }) => {
        const {
          orbitDur,
          orbitDelay,
          breathDur,
          breathDelay,
          frozenAngle,
        } = orbitParams(seed, i);
        const letter = ["a", "b", "c", "d"][i - 1] as "a" | "b" | "c" | "d";

        const orbitArmVars = {
          "--orbit-r": orbitRadiusCss(seed, i),
          "--orbit-dur": `${orbitDur}s`,
          "--orbit-delay": `${orbitDelay}s`,
          "--orbit-angle-frozen": `${frozenAngle}deg`,
        } as CSSProperties;

        const sparkBreathVars = {
          "--breath-dur": `${breathDur}s`,
          "--breath-delay": `${breathDelay}s`,
        } as CSSProperties;

        return (
          <div
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className={cn(
                "chakra-fog-orbit-arm pointer-events-none transition-transform duration-[2600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                intense ? "scale-[1.18] xl:scale-[1.08]" : "scale-100",
              )}
              style={orbitArmVars}
            >
              <div className="chakra-fog-orbit-counter pointer-events-none">
                <div
                  className={cn(
                    "chakra-fog-spark chakra-fog-breath pointer-events-none",
                    `chakra-fog-breath-${letter}`,
                    "transition-[width,height,opacity,filter,border-radius] duration-[2600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    intense
                      ? "h-[min(50vmin,400px)] w-[min(50vmin,400px)] opacity-[0.14] blur-[26px] sm:blur-[28px] lg:blur-[22px] xl:blur-[19px]"
                      : "h-[min(15vmin,112px)] w-[min(15vmin,112px)] opacity-[0.058] blur-[18px] sm:blur-[22px] lg:blur-[18px]",
                    tabVisible && "will-change-[transform,width,height,opacity]",
                  )}
                  style={{
                    ...sparkBreathVars,
                    background: bg,
                    borderRadius: blobRadiusCss(seed, i),
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
