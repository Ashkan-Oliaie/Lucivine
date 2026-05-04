import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchQuestList } from "@/api/quests";
import type { Quest } from "@/api/types";
import { cn } from "@/lib/cn";
import { questsForWeek, sortTracked, TIER_GLYPHS } from "./questHelpers";

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
        "w-4 h-4 text-quest-inkMuted shrink-0 transition-transform duration-300",
        expanded ? "rotate-0" : "rotate-180",
      )}
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/** Right-side island rail. Lists this week's available quests + tracked quests
 *  with progress bars. Hidden on screens narrower than `lg` — tablets see
 *  `QuestPathStrip` at the top, phones see the Quests bottom-nav tab. */
export function QuestRail({ expanded, onToggle }: Props) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["quests"],
    queryFn: () => fetchQuestList(),
  });

  const week = data?.current_week ?? 1;
  const allQuests = data?.results ?? [];
  const weekQuests = useMemo(
    () => questsForWeek(allQuests, week),
    [allQuests, week],
  );
  const tracked = useMemo(() => sortTracked(allQuests), [allQuests]);

  const goTo = (slug?: string) => {
    navigate(slug ? `/quests#${slug}` : "/quests");
  };

  return (
    <aside
      className={cn(
        "relative z-[30] hidden lg:flex shrink-0 flex-col self-stretch min-h-0 h-full rounded-3xl quest-surface shadow-quest-glow-soft overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "w-[260px]" : "w-[68px]",
      )}
      aria-expanded={expanded}
      aria-label="Quests"
    >
      <div className="shrink-0 p-2 border-b border-quest-border/50">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 rounded-2xl py-2.5 text-quest-inkMuted hover:text-quest-ink hover:bg-quest-accent/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-quest-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
            expanded ? "justify-start px-3" : "justify-center px-0",
          )}
          aria-label={expanded ? "Collapse quests" : "Expand quests"}
        >
          <RailChevron expanded={expanded} />
          {expanded && (
            <span className="text-xs font-medium tracking-wide truncate">
              Quests
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-3">
        {expanded ? (
          <ExpandedBody
            week={week}
            weekQuests={weekQuests}
            tracked={tracked}
            onOpen={goTo}
          />
        ) : (
          <CollapsedBody tracked={tracked} onOpen={goTo} />
        )}
      </div>
    </aside>
  );
}

function ExpandedBody({
  week,
  weekQuests,
  tracked,
  onOpen,
}: {
  week: number;
  weekQuests: Quest[];
  tracked: Quest[];
  onOpen: (slug?: string) => void;
}) {
  return (
    <>
      <div className="px-2 pt-2">
        <p className="font-semibold uppercase tracking-[0.14em] text-[10px] text-quest-accent">
          Week {week} · Quests
        </p>
        <p className="text-[11px] text-quest-inkMuted mt-1 leading-snug">
          Take on what calls to you. Tracked quests stay highlighted.
        </p>
      </div>

      {weekQuests.length === 0 ? (
        <p className="px-2 py-3 text-xs text-quest-inkMuted italic">
          No quests available this week yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {weekQuests.map((q) => (
            <QuestCard key={q.id} quest={q} onOpen={() => onOpen(q.slug)} />
          ))}
        </ul>
      )}

      {tracked.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-quest-border to-transparent mx-1" />
          <div className="px-2">
            <p className="font-semibold uppercase tracking-[0.14em] text-[10px] text-quest-gold">
              Tracking
            </p>
          </div>
          <ul className="space-y-1.5">
            {tracked.map((q) => (
              <TrackedRow key={q.id} quest={q} onOpen={() => onOpen(q.slug)} />
            ))}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={() => onOpen()}
        className="mt-2 w-full text-left rounded-xl border border-quest-border/60 bg-quest-surfaceStrong/40 hover:bg-quest-surfaceStrong/70 hover:border-quest-accent/40 transition-colors px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-quest-accent/60"
      >
        <span className="text-xs font-semibold text-quest-accentSoft">
          See all quests →
        </span>
      </button>
    </>
  );
}

function CollapsedBody({
  tracked,
  onOpen,
}: {
  tracked: Quest[];
  onOpen: (slug?: string) => void;
}) {
  return (
    <ul className="flex flex-col items-center gap-1.5 pt-1">
      {tracked.slice(0, 8).map((q) => (
        <li key={q.id}>
          <button
            type="button"
            title={q.name}
            onClick={() => onOpen(q.slug)}
            className={cn(
              "relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
              q.is_completed
                ? "bg-quest-accent/15 text-quest-accentSoft"
                : "bg-quest-surfaceStrong/50 text-quest-accent hover:bg-quest-surfaceStrong/80",
            )}
            aria-label={q.name}
          >
            <span className="text-base">{TIER_GLYPHS[q.tier] ?? "✦"}</span>
            {!q.is_completed && q.progress > 0 && (
              <span
                className="absolute bottom-1 left-1 right-1 h-[2px] bg-quest-accent/70 rounded-full"
                style={{ transform: `scaleX(${q.progress / 100})`, transformOrigin: "left" }}
              />
            )}
          </button>
        </li>
      ))}
      <li className="pt-1">
        <button
          type="button"
          onClick={() => onOpen()}
          title="All quests"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-quest-inkMuted hover:text-quest-accent hover:bg-quest-surfaceStrong/50 transition-colors"
          aria-label="All quests"
        >
          <span className="text-lg">＋</span>
        </button>
      </li>
    </ul>
  );
}

function QuestCard({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group w-full text-left rounded-xl px-2.5 py-2 transition-colors border",
          quest.is_tracked
            ? "border-quest-accent/45 bg-quest-accent/[0.08] shadow-[inset_0_0_0_1px_rgba(61,220,151,0.12)]"
            : quest.unlocked
              ? "border-quest-border/55 hover:border-quest-accent/40 hover:bg-quest-accent/[0.05]"
              : "border-quest-border/25 opacity-55",
        )}
      >
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm",
              quest.is_completed
                ? "bg-quest-accent/20 text-quest-accentSoft"
                : quest.unlocked
                  ? "bg-quest-surfaceStrong text-quest-accent"
                  : "bg-quest-surface text-quest-inkMuted",
            )}
          >
            {quest.is_completed ? "✓" : TIER_GLYPHS[quest.tier] ?? "✦"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-quest-ink leading-tight truncate">
              {quest.name}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-quest-inkMuted mt-0.5">
              T{quest.tier} · {quest.category}
            </p>
            {quest.is_tracked && !quest.is_completed && (
              <div className="h-[3px] mt-1.5 bg-quest-border/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${quest.progress}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-quest-accent to-quest-accentSoft"
                />
              </div>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function TrackedRow({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left rounded-lg px-2.5 py-1.5 hover:bg-quest-accent/[0.06] transition-colors flex items-center gap-2"
      >
        <span
          className={cn(
            "shrink-0 w-1.5 h-1.5 rounded-full",
            quest.is_completed ? "bg-quest-accentSoft" : "bg-quest-gold",
          )}
        />
        <span className="text-[12px] text-quest-inkSoft truncate flex-1">
          {quest.name}
        </span>
        {!quest.is_completed && (
          <span className="text-[10px] tabular-nums text-quest-inkMuted">
            {quest.progress}%
          </span>
        )}
      </button>
    </li>
  );
}
