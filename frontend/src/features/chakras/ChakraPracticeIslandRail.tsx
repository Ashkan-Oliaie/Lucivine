import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChakras } from "@/api/meditation";
import type { ChakraId } from "@/api/types";
import { ChakraPracticeIsland } from "@/features/chakras/ChakraPracticeIsland";

/**
 * Desktop rail beside global IslandSidebar across the entire `/chakras/*` section
 * (browse + per-center practice). Mounting the rail uniformly across the section
 * prevents the main column from reflowing leftward when navigating into a session.
 */
export function ChakraPracticeIslandRail() {
  const { pathname } = useLocation();
  if (!pathname.startsWith("/chakras")) return null;

  const sessionMatch = pathname.match(/^\/chakras\/([^/]+)$/);
  const rawId = sessionMatch?.[1];
  const isSession = Boolean(rawId) && rawId !== "browse";

  const { data: chakras, isPending } = useQuery({
    queryKey: ["chakras"],
    queryFn: fetchChakras,
    staleTime: 60 * 60_000,
  });

  if (isPending || !chakras?.length) {
    return (
      <aside
        className="relative z-[30] hidden md:flex shrink-0 flex-col h-full min-h-0 w-[17rem] rounded-2xl border border-white/[0.11] bg-black/[0.42] backdrop-blur-lg backdrop-saturate-110 overflow-hidden"
        aria-hidden
      >
        <div className="h-12 border-b border-white/[0.06] animate-pulse bg-white/[0.04]" />
        <div className="flex-1 min-h-0 p-2 space-y-2 overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              className="h-[3.25rem] rounded-xl animate-pulse bg-white/[0.06]"
            />
          ))}
        </div>
      </aside>
    );
  }

  const active = isSession
    ? chakras.find((c) => c.id === (rawId as ChakraId)) ?? chakras[0]
    : chakras[0];

  return (
    <div className="relative z-[30] hidden md:flex shrink-0 self-stretch flex-col min-h-0 h-full overflow-hidden">
      <ChakraPracticeIsland
        className="flex-1 min-h-0"
        chakras={chakras}
        activeId={active.id}
        active={active}
      />
    </div>
  );
}
