import { useId } from "react";
import { cn } from "@/lib/cn";

type Variant = "outline" | "gradient";

type Props = {
  size?: number | string;
  variant?: Variant;
  className?: string;
};

/**
 * Lucivine logo mark — two interlocking moons sharing a pupil.
 * Symbolises the "shared dream": two minds, one dream meeting at the lens.
 */
export function LogoMark({ size = 32, variant = "outline", className }: Props) {
  const uid = useId().replace(/:/g, "");
  const A = { cx: 36, cy: 50 };
  const B = { cx: 64, cy: 50 };
  const P = { cx: 50, cy: 50 };
  const R = 22;
  const sw = 1.6;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("block", className)}
      role="img"
      aria-label="Lucivine"
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8a8ff" />
          <stop offset="50%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#ff89b8" />
        </linearGradient>
        <radialGradient id={`${uid}-pa`} cx="35%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(184,168,255,0.45)" />
          <stop offset="60%" stopColor="rgba(124,92,255,0.18)" />
          <stop offset="100%" stopColor="rgba(124,92,255,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-pb`} cx="65%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(255,137,184,0.45)" />
          <stop offset="60%" stopColor="rgba(255,137,184,0.18)" />
          <stop offset="100%" stopColor="rgba(255,137,184,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-pp`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#b8a8ff" />
          <stop offset="100%" stopColor="#7c5cff" />
        </radialGradient>
        <clipPath id={`${uid}-lc`}>
          <circle cx={A.cx} cy={A.cy} r={R} />
        </clipPath>
      </defs>

      {variant === "gradient" ? (
        <g>
          <circle
            cx={A.cx}
            cy={A.cy}
            r={R}
            fill={`url(#${uid}-pa)`}
            stroke="currentColor"
            strokeWidth={sw}
            strokeOpacity="0.7"
          />
          <circle
            cx={B.cx}
            cy={B.cy}
            r={R}
            fill={`url(#${uid}-pb)`}
            stroke="currentColor"
            strokeWidth={sw}
            strokeOpacity="0.7"
          />
          <g clipPath={`url(#${uid}-lc)`}>
            <circle cx={B.cx} cy={B.cy} r={R} fill={`url(#${uid}-g)`} opacity="0.35" />
          </g>
          <circle cx={P.cx} cy={P.cy} r="4.2" fill={`url(#${uid}-pp)`} />
          <circle cx={A.cx} cy={A.cy} r="1.4" fill="currentColor" opacity="0.7" />
          <circle cx={B.cx} cy={B.cy} r="1.4" fill="currentColor" opacity="0.7" />
        </g>
      ) : (
        <g>
          <circle
            cx={A.cx}
            cy={A.cy}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={sw}
          />
          <circle
            cx={B.cx}
            cy={B.cy}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={sw}
          />
          <circle cx={P.cx} cy={P.cy} r="4.2" fill="currentColor" />
          <circle cx={A.cx} cy={A.cy} r="1.4" fill="currentColor" opacity="0.65" />
          <circle cx={B.cx} cy={B.cy} r="1.4" fill="currentColor" opacity="0.65" />
        </g>
      )}
    </svg>
  );
}

/** Wordmark "Luc<i italic gradient>vine" — the `i` is the dreaming eye. */
export function LucivineWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("leading-none tracking-[0.005em]", className)}>
      <span>Luc</span>
      <em
        className="not-italic"
        style={{
          background: "linear-gradient(135deg, #b8a8ff, #ff89b8)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          fontStyle: "italic",
          fontWeight: 300,
        }}
      >
        i
      </em>
      <span>vine</span>
    </span>
  );
}
