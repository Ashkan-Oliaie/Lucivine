import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type IconProps = Omit<ComponentPropsWithoutRef<"svg">, "children" | "stroke"> & {
  /** Pixel size shorthand. Pass via className instead for full Tailwind control. */
  size?: number | string;
  /** Stroke width — defaults to 1.5 (matches design). */
  stroke?: number;
};

type Internal = IconProps & { children: ReactNode };

function Icon({ size = 24, stroke = 1.5, className, children, ...rest }: Internal) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── Section nav icons ──────────────────────────────────────────────── */

export const IconProgram = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l9 17H3z" />
    <circle cx="12" cy="14" r="1.6" fill="currentColor" opacity="0.35" />
    <path d="M12 3v6" opacity="0.5" />
  </Icon>
);

export const IconJournal = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M5 17h14M9 8h6M9 11h4" />
    <circle cx="14.5" cy="13.5" r="0.8" fill="currentColor" />
  </Icon>
);

export const IconInsights = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 20h18" />
    <path d="M6 20v-5M11 20v-9M16 20v-6" />
    <circle cx="20" cy="6" r="1.6" fill="currentColor" opacity="0.4" />
    <path d="M6 15l5-4 5 6 4-11" opacity="0.55" />
  </Icon>
);

export const IconChakras = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="4.5" r="1.6" />
    <circle cx="12" cy="10" r="1.6" />
    <circle cx="12" cy="15.5" r="1.6" />
    <circle cx="12" cy="20.5" r="1.6" />
    <path d="M12 6v2.4M12 11.6v2.4M12 17v2" opacity="0.5" />
  </Icon>
);

export const IconQuests = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
    <circle cx="18.5" cy="17.5" r="1.2" fill="currentColor" opacity="0.45" />
    <circle cx="5.5" cy="18" r="0.8" fill="currentColor" opacity="0.6" />
    <circle cx="20" cy="5" r="0.6" fill="currentColor" opacity="0.7" />
  </Icon>
);

export const IconReality = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" opacity="0.6" />
  </Icon>
);

export const IconTransition = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" opacity="0.5" />
    <path d="M3 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
    <path d="M3 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" opacity="0.5" />
  </Icon>
);

export const IconAnalytics = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 16v-3M11 16v-7M15 16v-5M19 16v-9" />
    <circle cx="19" cy="7" r="0.7" fill="currentColor" />
  </Icon>
);

export const IconBell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" />
    <path d="M10 21h4" />
    <circle cx="12" cy="11" r="0.8" fill="currentColor" opacity="0.5" />
  </Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2L19 19M5 19l1.8-1.8M17.2 6.8L19 5" />
  </Icon>
);

/* ── Quick-action icons ─────────────────────────────────────────────── */

export const IconEye = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Icon>
);

export const IconMoon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    <circle cx="16.5" cy="7.5" r="0.7" fill="currentColor" />
    <circle cx="13" cy="11" r="0.5" fill="currentColor" opacity="0.6" />
  </Icon>
);
