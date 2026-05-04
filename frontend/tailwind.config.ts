import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05030f",
        deep: "#0c0824",
        twilight: "#1a1040",
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
        // Quest palette — distinct sage/emerald accent for the right-side quest
        // section. Deliberately separated from the app's amethyst/rose so the
        // quest UI reads as its own surface even when overlaid on shared chrome.
        quest: {
          base: "#0a1f1a",
          surface: "#0f2a23",
          surfaceStrong: "#143a30",
          border: "#1f5a48",
          accent: "#3ddc97",
          accentSoft: "#7ef0c0",
          accentDeep: "#1b9b6a",
          gold: "#f5c97d",
          ink: "#e6f7ee",
          inkSoft: "#a9d6c2",
          inkMuted: "#6c9a87",
        },
      },
      fontFamily: {
        /** Inter everywhere — use font-sans + weight/size for hierarchy */
        sans: [
          "'Inter'",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "'Inter'",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        body: [
          "'Inter'",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      letterSpacing: {
        ritual: "0.28em",
      },
      boxShadow: {
        glow: "0 0 60px -15px rgba(124, 92, 255, 0.55)",
        "glow-soft": "0 10px 40px -20px rgba(124, 92, 255, 0.5)",
        ring: "0 0 0 1px rgba(184, 168, 255, 0.18)",
        "quest-glow": "0 0 60px -20px rgba(61, 220, 151, 0.55)",
        "quest-glow-soft": "0 10px 40px -22px rgba(61, 220, 151, 0.5)",
      },
      backgroundImage: {
        "aurora-1":
          "radial-gradient(ellipse 80% 60% at 15% 12%, rgba(124, 92, 255, 0.55), transparent 60%)",
        "aurora-2":
          "radial-gradient(ellipse 70% 55% at 85% 25%, rgba(255, 137, 184, 0.32), transparent 60%)",
        "aurora-3":
          "radial-gradient(ellipse 90% 70% at 50% 110%, rgba(125, 197, 255, 0.32), transparent 65%)",
        "card-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(124,92,255,0.06) 100%)",
      },
      animation: {
        twinkle: "twinkle 4s ease-in-out infinite",
        breathe: "breathe 8s ease-in-out infinite",
        drift: "drift 28s ease-in-out infinite",
        "drift-slow": "drift 42s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        "spin-slow": "spin 18s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "orb-pulse": "orb-pulse 6s ease-in-out infinite",
        "ring-spin": "ring-spin 22s linear infinite",
        float: "float 14s ease-in-out infinite",
        aurora: "aurora-shift 18s ease-in-out infinite",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.12)", opacity: "1" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(3%, -2%, 0) scale(1.05)" },
          "66%": { transform: "translate3d(-2%, 3%, 0) scale(0.97)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "orb-pulse": {
          "0%, 100%": { opacity: "0.65", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        "ring-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "aurora-shift": {
          "0%, 100%": { opacity: "0.35", transform: "translate(0, 0) scale(1)" },
          "50%": { opacity: "0.55", transform: "translate(4%, -3%) scale(1.08)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
