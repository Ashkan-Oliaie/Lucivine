import { useId } from "react";
import type { ChakraId } from "@/api/types";
import { cn } from "@/lib/cn";

type Props = {
  id: ChakraId;
  color: string;
  className?: string;
};

/** Hand-drawn geometric marks per energy center — SVG only, no external assets */
export function ChakraGlyph({ id, color, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const filt = `chakra-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id={filt} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {id === "root" && (
        <g filter={`url(#${filt})`}>
          <path
            d="M40 58c-8-6-14-14-14-24s6-18 14-24c8 6 14 14 14 24s-6 18-14 24z"
            stroke={color}
            strokeWidth="1.6"
            opacity="0.9"
          />
          <path
            d="M40 48c-5-4-9-10-9-16s4-12 9-16c5 4 9 10 9 16s-4 12-9 16z"
            stroke={color}
            strokeWidth="1.2"
            opacity="0.5"
          />
          <circle cx="40" cy="22" r="3" fill={color} opacity="0.85" />
        </g>
      )}
      {id === "sacral" && (
        <g filter={`url(#${filt})`}>
          <path
            d="M24 42c0-12 8-20 18-22c10 2 18 12 18 24c0 8-5 14-12 18"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.85"
          />
          <ellipse cx="44" cy="36" rx="14" ry="10" stroke={color} strokeWidth="1.2" opacity="0.35" />
        </g>
      )}
      {id === "solar" && (
        <g filter={`url(#${filt})`}>
          <circle cx="40" cy="40" r="10" stroke={color} strokeWidth="1.8" opacity="0.9" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const r = (deg * Math.PI) / 180;
            const x1 = 40 + Math.cos(r) * 14;
            const y1 = 40 + Math.sin(r) * 14;
            const x2 = 40 + Math.cos(r) * 22;
            const y2 = 40 + Math.sin(r) * 22;
            return (
              <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.4" opacity="0.7" />
            );
          })}
        </g>
      )}
      {id === "heart" && (
        <g filter={`url(#${filt})`}>
          <path
            d="M40 54c12-10 18-18 18-26a9 9 0 0 0-9-9c-4 0-7 2-9 5-2-3-5-5-9-5a9 9 0 0 0-9 9c0 8 6 16 18 26z"
            stroke={color}
            strokeWidth="1.6"
            fill={color}
            fillOpacity={0.12}
          />
          <path d="M40 46v-16M32 38h16" stroke={color} strokeWidth="1" opacity="0.35" strokeLinecap="round" />
        </g>
      )}
      {id === "throat" && (
        <g filter={`url(#${filt})`}>
          <circle cx="40" cy="40" r="18" stroke={color} strokeWidth="1.4" opacity="0.45" />
          <path
            d="M22 34c6 4 12 4 18 0s12-4 18 0M22 46c6-4 12-4 18 0s12 4 18 0"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="40" cy="40" r="5" stroke={color} strokeWidth="1.2" opacity="0.7" />
        </g>
      )}
      {id === "thirdeye" && (
        <g filter={`url(#${filt})`}>
          <path d="M40 22 L58 54 H22 Z" stroke={color} strokeWidth="1.6" opacity="0.5" />
          <ellipse cx="40" cy="38" rx="14" ry="10" stroke={color} strokeWidth="1.8" opacity="0.85" />
          <circle cx="40" cy="38" r="5" fill={color} opacity="0.6" />
          <circle cx="40" cy="38" r="2" fill="#0a0620" />
        </g>
      )}
      {id === "crown" && (
        <g filter={`url(#${filt})`}>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
            const r = ((deg + 15) * Math.PI) / 180;
            const inner = 12 + (i % 3);
            const outer = 22 + (i % 4);
            const x1 = 40 + Math.cos(r) * inner;
            const y1 = 40 + Math.sin(r) * inner;
            const x2 = 40 + Math.cos(r) * outer;
            const y2 = 40 + Math.sin(r) * outer;
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="1.2"
                opacity={0.35 + (i % 3) * 0.15}
              />
            );
          })}
          <circle cx="40" cy="40" r="6" stroke={color} strokeWidth="1.4" opacity="0.9" />
        </g>
      )}
    </svg>
  );
}
