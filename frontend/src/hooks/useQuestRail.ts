import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "oa-quest-rail-expanded";

/** Persisted expand/collapse state for the right-side QuestRail.
 *  Mirrors `useSidebarRail` but keys its own preference so the two rails
 *  collapse independently. */
export function useQuestRail(defaultExpanded = true) {
  const [expanded, setExpanded] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "false") return false;
      if (raw === "true") return true;
    } catch {
      /* ignore */
    }
    return defaultExpanded;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, expanded ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [expanded]);

  const toggle = useCallback(() => setExpanded((e) => !e), []);

  return { expanded, setExpanded, toggle };
}
