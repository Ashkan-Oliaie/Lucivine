import type { Quest } from "@/api/types";

/** Quests that are visible in `week`: the quest's `weeks` list contains
 *  `week`, OR the list is empty (which means "every week"). */
export function questsForWeek(quests: Quest[], week: number): Quest[] {
  return quests.filter(
    (q) => q.weeks.length === 0 || q.weeks.includes(week),
  );
}

/** Tracked quests, sorted: in-progress first, then completed, then by tier. */
export function sortTracked(quests: Quest[]): Quest[] {
  return [...quests]
    .filter((q) => q.is_tracked)
    .sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });
}

/** A short reason string explaining why a quest is locked. */
export function lockReason(
  quest: Quest,
  lucidCount: number,
  currentWeek: number,
): string | null {
  if (quest.unlocked) return null;
  if (currentWeek < quest.min_week) {
    return `Reach week ${quest.min_week} of the path`;
  }
  if (lucidCount < quest.min_lucid_count) {
    const need = quest.min_lucid_count - lucidCount;
    return `${need} more lucid dream${need === 1 ? "" : "s"} to unlock`;
  }
  if (quest.prerequisites.length > 0) {
    return `Complete: ${quest.prerequisites.join(", ")}`;
  }
  return "Locked";
}

export const TIER_GLYPHS: Record<number, string> = {
  1: "✦",
  2: "✶",
  3: "✷",
  4: "❋",
  5: "✺",
};
