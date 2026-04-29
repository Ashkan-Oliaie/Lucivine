import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { NAV } from "./nav";
import { cn } from "@/lib/cn";

type Props = {
  expanded: boolean;
  onToggle: () => void;
};

function RailChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "w-4 h-4 text-ink-muted shrink-0 transition-transform duration-300",
        expanded ? "rotate-0" : "rotate-180",
      )}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IslandSidebar({ expanded, onToggle }: Props) {
  const primary = NAV.filter((n) => n.primary);
  const tools = NAV.filter((n) => !n.primary);

  return (
    <aside
      className={cn(
        "relative z-[30] hidden md:flex shrink-0 flex-col self-stretch min-h-0 h-full rounded-3xl border border-white/[0.11] bg-black/[0.42] backdrop-blur-lg backdrop-saturate-110 shadow-[0_12px_48px_-28px_rgba(0,0,0,0.72)] overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "w-[236px]" : "w-[76px]",
      )}
      aria-expanded={expanded}
      aria-label="Primary navigation"
    >
      <div className="shrink-0 p-2 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 rounded-2xl py-2.5 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition-colors focus-ring",
            expanded ? "justify-start px-3" : "justify-center px-0",
          )}
          aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
        >
          <RailChevron expanded={expanded} />
          {expanded && (
            <span className="text-xs font-medium tracking-wide truncate">
              Collapse
            </span>
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 p-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {expanded ? (
          <p className="ritual-eyebrow px-2.5 pt-3 pb-1">Practice</p>
        ) : (
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-2 my-2 shrink-0" />
        )}
        {primary.map((item) => (
          <IslandNavLink key={item.to} item={item} expanded={expanded} />
        ))}

        {expanded ? (
          <p className="ritual-eyebrow px-2.5 pt-5 pb-1">Tools</p>
        ) : (
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-2 my-3 shrink-0" />
        )}
        {tools.map((item) => (
          <IslandNavLink key={item.to} item={item} expanded={expanded} />
        ))}
      </nav>
    </aside>
  );
}

function IslandNavLink({
  item,
  expanded,
}: {
  item: { to: string; label: string; glyph: string };
  expanded: boolean;
}) {
  const { pathname } = useLocation();
  const chakraNav =
    item.to === "/chakras/root" &&
    pathname.startsWith("/chakras") &&
    pathname !== "/chakras/browse";

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={!expanded ? item.label : undefined}
      className={({ isActive }) => {
        const active = item.to === "/chakras/root" ? chakraNav : isActive;
        return cn(
          "group relative flex items-center rounded-xl text-sm transition-colors min-h-[44px]",
          expanded ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5",
          active
            ? "bg-accent-amethyst/26 text-white ring-1 ring-accent-amethyst/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-accent-amethyst/28"
            : "text-white/[0.78] border border-transparent hover:bg-white/[0.08] hover:text-white",
        );
      }}
    >
      {({ isActive }) => {
        const active = item.to === "/chakras/root" ? chakraNav : isActive;
        return (
          <>
            {active && expanded && (
              <motion.span
                layoutId="island-rail-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-accent-amethyst to-accent-rose"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {active && !expanded && (
              <span className="absolute inset-1 rounded-xl bg-accent-amethyst/22 ring-1 ring-accent-amethyst/40" />
            )}
            <span
              className={cn(
                "relative z-[1] text-center text-lg leading-none shrink-0 w-7",
                active ? "text-accent-lavender" : "text-accent-lavender/95 group-hover:text-accent-lavender",
              )}
            >
              {item.glyph}
            </span>
            <span
              className={cn(
                "relative z-[1] truncate transition-[opacity,width] duration-200",
                expanded ? "opacity-100 max-w-[160px]" : "opacity-0 w-0 overflow-hidden pointer-events-none",
                active ? "text-white" : "text-white/[0.78]",
              )}
            >
              {item.label}
            </span>
          </>
        );
      }}
    </NavLink>
  );
}
