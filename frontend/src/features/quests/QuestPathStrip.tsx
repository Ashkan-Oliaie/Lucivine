import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchQuestList } from "@/api/quests";
import { cn } from "@/lib/cn";
import { questsForWeek, TIER_GLYPHS } from "./questHelpers";

/** Horizontal "path on top" — shown on tablets (md..lg). The right rail is
 *  hidden at this width because the main column needs the room. */
export function QuestPathStrip() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["quests"],
    queryFn: () => fetchQuestList(),
  });

  const week = data?.current_week ?? 1;
  const allQuests = data?.results ?? [];
  const quests = useMemo(
    () => questsForWeek(allQuests, week),
    [allQuests, week],
  );

  if (quests.length === 0) return null;

  return (
    <div className="hidden md:flex lg:hidden quest-surface rounded-2xl shadow-quest-glow-soft px-3 py-2.5 mb-4 items-center gap-3">
      <div className="shrink-0 px-2">
        <p className="font-semibold uppercase tracking-[0.14em] text-[9px] text-quest-accent">
          Week {week}
        </p>
        <p className="text-[10px] text-quest-inkMuted -mt-0.5">Quests</p>
      </div>
      <div className="h-8 w-px bg-quest-border/60" />
      <ul className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quests.map((q) => (
          <li key={q.id} className="shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/quests#${q.slug}`)}
              className={cn(
                "group flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 border transition-colors",
                q.is_tracked
                  ? "border-quest-accent/55 bg-quest-accent/[0.10] text-quest-ink"
                  : q.unlocked
                    ? "border-quest-border/60 text-quest-inkSoft hover:border-quest-accent/40 hover:bg-quest-accent/[0.06]"
                    : "border-quest-border/25 text-quest-inkMuted opacity-55",
              )}
              title={q.name}
            >
              <span
                className={cn(
                  "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px]",
                  q.is_completed
                    ? "bg-quest-accent/25 text-quest-accentSoft"
                    : q.is_tracked
                      ? "bg-quest-accent/20 text-quest-accent"
                      : "bg-quest-surfaceStrong/60 text-quest-accent",
                )}
              >
                {q.is_completed ? "✓" : TIER_GLYPHS[q.tier] ?? "✦"}
              </span>
              <span className="text-[11px] font-medium whitespace-nowrap">
                {q.name}
              </span>
              {q.is_tracked && !q.is_completed && q.progress > 0 && (
                <span className="text-[9px] tabular-nums text-quest-inkMuted ml-0.5">
                  {q.progress}%
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigate("/quests")}
        className="shrink-0 text-[11px] font-semibold text-quest-accent hover:text-quest-accentSoft transition-colors px-2"
      >
        All →
      </button>
    </div>
  );
}
