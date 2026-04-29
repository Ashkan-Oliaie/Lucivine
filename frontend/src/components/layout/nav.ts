export type NavItem = {
  to: string;
  label: string;
  glyph: string;
  primary: boolean;
};

// Program is now the landing page (/). Dashboard lives at /dashboard.
export const NAV: NavItem[] = [
  { to: "/", label: "Program", glyph: "▲", primary: true },
  { to: "/journal", label: "Journal", glyph: "❍", primary: true },
  { to: "/dashboard", label: "Insights", glyph: "✷", primary: true },
  { to: "/chakras/root", label: "Chakras", glyph: "✦", primary: true },
  { to: "/spells", label: "Spells", glyph: "☾", primary: true },
  { to: "/reality", label: "Reality", glyph: "○", primary: false },
  { to: "/transition", label: "Transition", glyph: "≈", primary: false },
  { to: "/analytics", label: "Analytics", glyph: "▦", primary: false },
  { to: "/reminders", label: "Reminders", glyph: "◐", primary: false },
  { to: "/settings", label: "Settings", glyph: "⚙", primary: false },
];

export const PRIMARY_NAV = NAV.filter((n) => n.primary);
export const SECONDARY_NAV = NAV.filter((n) => !n.primary);
