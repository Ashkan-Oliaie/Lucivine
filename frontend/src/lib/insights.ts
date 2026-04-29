import type { ChakraId } from "@/api/types";
import type { Dashboard } from "@/api/types";

/** Labels for trait pills — derived from logged behaviour */
export function derivePracticeTraits(d: Dashboard): string[] {
  const traits: string[] = [];
  const L = d.last_30_days;

  if (L.reality_checks >= 45) traits.push("High vigilance — waking checks are a habit");
  else if (L.reality_checks >= 15) traits.push("Building RC rhythm");

  if (L.lucid_dreams >= 4) traits.push("Strong lucid signal this month");
  else if (L.lucid_dreams >= 1) traits.push("Lucid moments emerging");

  if (L.chakra_minutes >= 120) traits.push("Deep inner practice — chakra time dominates");
  else if (L.chakra_minutes >= 30) traits.push("Balancing body awareness");

  const chakraHrs = (d.totals.chakra_seconds ?? 0) / 3600;
  const dreamCore =
    (d.totals.dream_entries ?? 0) + (d.totals.lucid_dreams ?? 0);
  if (chakraHrs > 2 && dreamCore > 5) traits.push("Bridge worker — meditation ↔ dreams");

  if (traits.length === 0)
    traits.push("Early arc — keep logging to reveal your pattern");

  return traits.slice(0, 5);
}

export type ChakraRow = {
  id: ChakraId;
  label: string;
  minutes: number;
  pctOfTotal: number;
  band: "strong" | "steady" | "underfed";
};

export function chakraBalanceRows(
  perChakra: Array<{ chakra_id: ChakraId; seconds: number }>,
  chakraLabels: Partial<Record<ChakraId, string>>,
): ChakraRow[] {
  const raw = perChakra.reduce((s, p) => s + p.seconds, 0);
  const totalSec = raw > 0 ? raw : 1;
  const rows: ChakraRow[] = perChakra.map((p) => {
    const pct = p.seconds / totalSec;
    let band: ChakraRow["band"] = "steady";
    if (pct >= 0.22) band = "strong";
    else if (pct <= 0.08 && totalSec > 600) band = "underfed";
    return {
      id: p.chakra_id,
      label: chakraLabels[p.chakra_id] ?? p.chakra_id,
      minutes: Math.round(p.seconds / 60),
      pctOfTotal: pct,
      band,
    };
  });
  return rows.sort((a, b) => b.minutes - a.minutes);
}

export type DreamFocusId =
  | "recall"
  | "lucidity"
  | "stay_lucid"
  | "fly_move"
  | "memory_tags"
  | "emotion";

export type DreamFocusGoal = {
  id: DreamFocusId;
  label: string;
  hint: string;
  anchors: string[];
};

export const DREAM_FOCUS_GOALS: DreamFocusGoal[] = [
  {
    id: "recall",
    label: "Recall",
    hint: "Hold dreams longer after waking.",
    anchors: ["Morning stillness before screens", "Journal same morning", "Voice memo first"],
  },
  {
    id: "lucidity",
    label: "Lucidity",
    hint: "Notice you are dreaming more often.",
    anchors: ["Daytime RCs every ~2h", "Question novelty before sleep", "MILD/WBTB blocks"],
  },
  {
    id: "stay_lucid",
    label: "Stay lucid",
    hint: "Extend clarity inside the dream.",
    anchors: ["Rub hands / spin sparingly", "Simple verbal affirmations", "Lower excitement spikes"],
  },
  {
    id: "fly_move",
    label: "Flight / motion",
    hint: "Move deliberately without waking.",
    anchors: ["Practice expectation not force", "Start from jumping → floating", "Chakra throat/third-eye sits"],
  },
  {
    id: "memory_tags",
    label: "Symbols",
    hint: "Train recurring motifs.",
    anchors: ["Title entries with one symbol tag", "Weekly symbol scan", "Transition journaling"],
  },
  {
    id: "emotion",
    label: "Night emotion",
    hint: "Work nightmares / charge safely.",
    anchors: ["Pre-sleep sentence of safety", "Heart chakra sits", "Morning EFT-style jot"],
  },
];

export const FOCUS_STORAGE_KEY = "oa-dream-focus-goal";
