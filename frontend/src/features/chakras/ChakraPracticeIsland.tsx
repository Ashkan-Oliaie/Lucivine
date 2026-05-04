import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChakraGlyph } from "@/components/chakras/ChakraGlyph";
import type { Chakra, ChakraId } from "@/api/types";
import { cn } from "@/lib/cn";

const RAIL_EXPANDED_KEY = "oa-chakra-rail-expanded";

function readRailExpanded(): boolean {
  try {
    const v = localStorage.getItem(RAIL_EXPANDED_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

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
        "w-4 h-4 text-ink-muted shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "rotate-0" : "rotate-180",
      )}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

type Props = {
  chakras: Chakra[];
  activeId: ChakraId;
  active: Chakra;
  className?: string;
};

const COLLAPSED_W = "md:w-[4.75rem]";
const EXPANDED_W = "md:w-[17rem]";

/** Chakra rail with collapse control; selected summary text only when expanded. */
export function ChakraPracticeIsland({ chakras, activeId, active, className }: Props) {
  const [expanded, setExpanded] = useState(readRailExpanded);

  function persist(next: boolean) {
    setExpanded(next);
    try {
      localStorage.setItem(RAIL_EXPANDED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <aside
      className={cn(
        "relative z-[30] flex flex-col rounded-2xl border border-white/[0.11] bg-black/[0.42] backdrop-blur-lg backdrop-saturate-110 shadow-[0_12px_48px_-28px_rgba(0,0,0,0.62)] overflow-hidden min-h-0 h-full",
        "w-full transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width]",
        expanded ? EXPANDED_W : COLLAPSED_W,
        className,
      )}
      aria-label="Chakra centers"
    >
      <div className="shrink-0 border-b border-white/[0.06] px-3 py-3 space-y-2.5">
        <div className="flex items-center gap-2 min-h-[2.75rem]">
          <button
            type="button"
            onClick={() => persist(!expanded)}
            className={cn(
              "flex items-center justify-center rounded-xl py-2.5 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition-colors shrink-0",
              expanded ? "px-3" : "md:w-full md:px-0 px-3",
            )}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse chakra menu" : "Expand chakra menu"}
          >
            <RailChevron expanded={expanded} />
          </button>
          {expanded && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-secondary truncate">
              Centers
            </span>
          )}
        </div>
        {expanded && (
          <p className="text-[11px] md:text-xs text-ink-secondary leading-relaxed line-clamp-5 border-l border-white/[0.08] pl-3 ml-1">
            {active.theme}
          </p>
        )}
      </div>

      <nav
        className={cn(
          "flex flex-col gap-1 p-2 overflow-hidden overflow-x-hidden flex-1 min-h-0 min-w-0",
          !expanded && "items-center md:items-stretch",
        )}
      >
        {chakras.map((c) => {
          const isActive = c.id === activeId;
          return (
            <NavLink
              key={c.id}
              to={`/chakras/${c.id}`}
              className={cn(
                "flex items-center rounded-xl transition-colors shrink-0 w-full max-w-full",
                expanded ? "gap-3 px-2.5 py-3 min-h-[3.25rem] justify-start" : "justify-center px-2 py-2.5 md:min-h-[3rem]",
                isActive
                  ? "bg-accent-amethyst/26 ring-2 ring-accent-amethyst/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-accent-amethyst/25"
                  : "border border-transparent hover:bg-white/[0.08]",
              )}
              title={c.english}
            >
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: isActive ? `${c.color}cc` : "rgba(255,255,255,0.08)",
                  background: `radial-gradient(circle at 35% 28%, ${c.color}${isActive ? "99" : "66"}, ${c.color}${isActive ? "26" : "18"} 62%, transparent 88%)`,
                  boxShadow: isActive
                    ? `0 0 32px -4px ${c.color}, 0 0 14px -2px ${c.color}aa, inset 0 0 22px -8px ${c.color}cc`
                    : undefined,
                }}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full motion-safe:animate-[nebula-pulse_4s_ease-in-out_infinite]"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${c.color}66, transparent 70%)`,
                      filter: "blur(8px)",
                    }}
                  />
                )}
                <ChakraGlyph
                  id={c.id}
                  color="#f5f3ff"
                  accent={c.color}
                  animated={isActive}
                  className={cn(
                    "relative z-[1]",
                    isActive
                      ? "h-8 w-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      : "h-7 w-7",
                  )}
                />
              </span>
              {expanded && (
                <span
                  className={cn(
                    "min-w-0 text-left text-[13px] font-medium leading-snug truncate",
                    isActive ? "text-white font-semibold" : "text-white/[0.82]",
                  )}
                >
                  {c.english}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
