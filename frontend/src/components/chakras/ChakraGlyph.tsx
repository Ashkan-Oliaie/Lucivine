import { useId } from "react";
import type { ChakraId } from "@/api/types";
import { cn } from "@/lib/cn";

type Props = {
  id: ChakraId;
  /** Stroke / line color (typically a near-white). */
  color: string;
  /** Tint for petal halos and inner orb. Defaults to `color`. */
  accent?: string;
  /** Render slow rotating rings + nebula pulse on the halo. */
  animated?: boolean;
  /** Render the outer aurora halo behind the mandala (looks best at >=48px). */
  bloom?: boolean;
  className?: string;
};

const PETALS: Record<ChakraId, number> = {
  root: 4,
  sacral: 6,
  solar: 10,
  heart: 12,
  throat: 16,
  thirdeye: 2,
  crown: 24,
};

export function ChakraGlyph({
  id,
  color,
  accent,
  animated = false,
  bloom = false,
  className,
}: Props) {
  const tint = accent ?? color;
  const uid = useId().replace(/:/g, "");
  const haloId = `cg-halo-${uid}`;
  const coreId = `cg-core-${uid}`;
  const ringId = `cg-ring-${uid}`;

  const petals = PETALS[id];
  const arr = Array.from({ length: petals });

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block overflow-visible shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id={haloId} cx="0.5" cy="0.5">
          <stop offset="0" stopColor={tint} stopOpacity="0.95" />
          <stop offset="0.45" stopColor={tint} stopOpacity="0.55" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId} cx="0.5" cy="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.4" stopColor={tint} stopOpacity="0.9" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ringId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.9" />
          <stop offset="1" stopColor={tint} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {bloom && (
        <>
          <circle
            cx="50"
            cy="50"
            r="56"
            fill={`url(#${haloId})`}
            opacity="0.6"
            style={
              animated
                ? {
                    animation: "nebula-pulse 6s ease-in-out infinite",
                    transformOrigin: "50% 50%",
                  }
                : undefined
            }
          />
          <circle cx="50" cy="50" r="46" fill={`url(#${haloId})`} opacity="0.9" />
        </>
      )}

      {/* Dotted outer ring */}
      <g
        style={
          animated
            ? {
                animation: "ring-spin 24s linear infinite",
                transformOrigin: "50% 50%",
              }
            : undefined
        }
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={tint}
          strokeWidth="0.7"
          strokeDasharray="0.8 3"
          opacity="0.65"
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={i}
            cx={50 + Math.cos((i * Math.PI) / 4) * 42}
            cy={50 + Math.sin((i * Math.PI) / 4) * 42}
            r="0.95"
            fill={tint}
            opacity="0.85"
          />
        ))}
      </g>

      {/* Counter-rotating dashed ring */}
      <g
        style={
          animated
            ? {
                animation: "ring-spin 16s linear infinite reverse",
                transformOrigin: "50% 50%",
              }
            : undefined
        }
      >
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke={`url(#${ringId})`}
          strokeWidth="0.7"
          strokeDasharray="1 3"
          opacity="0.6"
        />
      </g>

      {/* Petal mandala — count matches traditional chakra symbology */}
      <g
        style={
          animated
            ? {
                animation: "ring-spin 80s linear infinite",
                transformOrigin: "50% 50%",
              }
            : undefined
        }
      >
        {arr.map((_, i) => {
          const angle = (i * 360) / petals;
          return (
            <ellipse
              key={i}
              cx="50"
              cy="22"
              rx="4"
              ry="14"
              fill={tint}
              fillOpacity="0.1"
              stroke={color}
              strokeWidth="1"
              opacity="0.9"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
      </g>

      <circle
        cx="50"
        cy="50"
        r="14"
        fill="none"
        stroke={color}
        strokeWidth="1.1"
        opacity="0.85"
      />
      <circle cx="50" cy="50" r="6" fill={`url(#${coreId})`} />
      <circle cx="50" cy="50" r="2" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}
