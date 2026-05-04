/** Centralised design tokens — keep in sync with `tailwind.config.ts`.
 *
 * Use these from TS/TSX (motion configs, dynamic styles, canvas/three colors).
 * For static styling, prefer the Tailwind classes (`bg-quest-surface`,
 * `text-accent-amethyst`, etc.) so the tokens stay declarative.
 */

export const appTheme = {
  bg: {
    void: "#05030f",
    deep: "#0c0824",
    twilight: "#1a1040",
  },
  ink: {
    primary: "#f1ecff",
    secondary: "#bdb4e6",
    muted: "#7a6fa8",
  },
  accent: {
    amethyst: "#7c5cff",
    lavender: "#b8a8ff",
    amber: "#ffd57a",
    rose: "#ff89b8",
    azure: "#7dc5ff",
    mint: "#7affd1",
  },
  chakra: {
    root: "#e74c3c",
    sacral: "#ff8c42",
    solar: "#ffd93d",
    heart: "#3ddc97",
    throat: "#4ab5ff",
    thirdeye: "#7c5cff",
    crown: "#d6b3ff",
  },
} as const;

export const questTheme = {
  bg: {
    base: "#0a1f1a",
    surface: "#0f2a23",
    surfaceStrong: "#143a30",
  },
  border: "#1f5a48",
  accent: "#3ddc97",
  accentSoft: "#7ef0c0",
  accentDeep: "#1b9b6a",
  gold: "#f5c97d",
  ink: {
    primary: "#e6f7ee",
    secondary: "#a9d6c2",
    muted: "#6c9a87",
  },
  gradient: {
    accent: "linear-gradient(135deg, #3ddc97 0%, #7ef0c0 50%, #f5c97d 100%)",
    rail:
      "linear-gradient(180deg, rgba(20,58,48,0.72) 0%, rgba(10,31,26,0.72) 100%)",
  },
} as const;

export const theme = {
  app: appTheme,
  quest: questTheme,
} as const;

export type Theme = typeof theme;
