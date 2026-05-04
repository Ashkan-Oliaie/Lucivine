import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  completeQuestTracking,
  fetchQuestList,
  fetchQuestLog,
  listUserQuests,
  logQuestAttempt,
  trackQuest,
  untrackQuest,
  updateQuestTracking,
} from "@/api/quests";
import type { Quest, UserQuest } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";
import { lockReason, TIER_GLYPHS } from "./questHelpers";

export default function QuestsPage() {
  const qc = useQueryClient();
  const location = useLocation();
  const [selected, setSelected] = useState<Quest | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [filterWeek, setFilterWeek] = useState<number | "all">("all");

  const { data: list } = useQuery({
    queryKey: ["quests"],
    queryFn: () => fetchQuestList(),
  });

  const { data: questLog } = useQuery({
    queryKey: ["quest-log"],
    queryFn: fetchQuestLog,
  });

  const { data: userQuests } = useQuery({
    queryKey: ["user-quests"],
    queryFn: listUserQuests,
  });

  const userQuestByQuest = useMemo(
    () =>
      new Map<string, UserQuest>(
        (userQuests?.results ?? []).map((uq) => [uq.quest, uq]),
      ),
    [userQuests],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["quests"] });
    qc.invalidateQueries({ queryKey: ["quest-log"] });
    qc.invalidateQueries({ queryKey: ["user-quests"] });
  };

  const trackM = useMutation({
    mutationFn: trackQuest,
    onSuccess: invalidate,
  });
  const untrackM = useMutation({
    mutationFn: untrackQuest,
    onSuccess: invalidate,
  });
  const progressM = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      updateQuestTracking(id, { progress }),
    onSuccess: invalidate,
  });
  const completeM = useMutation({
    mutationFn: completeQuestTracking,
    onSuccess: invalidate,
  });
  const logAttempt = useMutation({
    mutationFn: logQuestAttempt,
    onSuccess: () => {
      invalidate();
      setLogError(null);
      setSelected(null);
    },
    onError: (err) => setLogError(extractMessage(err)),
  });

  // Open the quest the URL hash points at (e.g. coming from QuestRail).
  useEffect(() => {
    if (!list) return;
    const hash = location.hash?.slice(1);
    if (!hash) return;
    const found = list.results.find((q) => q.slug === hash);
    if (found) setSelected(found);
  }, [list, location.hash]);

  const tiers = [1, 2, 3, 4, 5];
  const weeks = useMemo(() => {
    const set = new Set<number>();
    list?.results.forEach((q) => q.weeks.forEach((w) => set.add(w)));
    return [...set].sort((a, b) => a - b);
  }, [list]);

  const visibleQuests = useMemo(() => {
    if (!list) return [];
    if (filterWeek === "all") return list.results;
    return list.results.filter(
      (q) => q.weeks.length === 0 || q.weeks.includes(filterWeek),
    );
  }, [list, filterWeek]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="quest-section"
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-quest-accent mb-3">
        Quests
      </p>
      <h1 className="text-4xl md:text-5xl font-light text-ink-primary">
        Take on the dream{" "}
        <em className="text-quest-accentSoft not-italic">deliberately</em>.
      </h1>
      <p className="italic text-ink-secondary text-base md:text-lg mt-4 max-w-xl">
        {list
          ? `Week ${list.current_week} · ${list.lucid_count} lucid dream${list.lucid_count === 1 ? "" : "s"} recorded. Track quests to keep them in your rail.`
          : "Loading quests…"}
      </p>

      {/* Week filter */}
      <div className="mt-8 flex items-center gap-2 flex-wrap">
        <FilterPill
          active={filterWeek === "all"}
          onClick={() => setFilterWeek("all")}
        >
          All weeks
        </FilterPill>
        {weeks.map((w) => (
          <FilterPill
            key={w}
            active={filterWeek === w}
            onClick={() => setFilterWeek(w)}
          >
            Week {w}
          </FilterPill>
        ))}
      </div>

      <div className="mt-10 space-y-10">
        {tiers.map((tier) => {
          const tierQuests = visibleQuests.filter((q) => q.tier === tier);
          if (tierQuests.length === 0) return null;
          return (
            <section key={tier}>
              <p className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkMuted mb-3">
                Tier {tier}
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tierQuests.map((quest) => {
                  const log = questLog?.find(
                    (g) => g.quest.slug === quest.slug,
                  );
                  return (
                    <li key={quest.id}>
                      <QuestTile
                        quest={quest}
                        attempts={log?.attempts.length ?? 0}
                        avg={log?.avg_success ?? null}
                        lucidCount={list?.lucid_count ?? 0}
                        currentWeek={list?.current_week ?? 1}
                        onOpen={() => setSelected(quest)}
                        onTrackToggle={() => {
                          const uq = userQuestByQuest.get(quest.id);
                          if (uq && quest.is_tracked) {
                            untrackM.mutate(uq.id);
                          } else {
                            trackM.mutate(quest.id);
                          }
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <QuestDetail
        quest={selected}
        userQuest={selected ? userQuestByQuest.get(selected.id) : undefined}
        onClose={() => {
          setSelected(null);
          setLogError(null);
        }}
        onTrackToggle={() => {
          if (!selected) return;
          const uq = userQuestByQuest.get(selected.id);
          if (uq && selected.is_tracked) untrackM.mutate(uq.id);
          else trackM.mutate(selected.id);
        }}
        onProgress={(progress) => {
          if (!selected) return;
          const uq = userQuestByQuest.get(selected.id);
          if (uq) progressM.mutate({ id: uq.id, progress });
        }}
        onComplete={() => {
          if (!selected) return;
          const uq = userQuestByQuest.get(selected.id);
          if (uq) completeM.mutate(uq.id);
        }}
        onLogAttempt={(rating, notes) =>
          selected &&
          logAttempt.mutate({
            quest: selected.id,
            success_rating: rating,
            notes: notes || undefined,
          })
        }
        logging={logAttempt.isPending}
        error={logError}
      />
    </motion.div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
        active
          ? "bg-quest-accent/15 border-quest-accent/55 text-quest-ink"
          : "border-quest-border/50 text-quest-inkSoft hover:border-quest-accent/40 hover:text-quest-ink",
      )}
    >
      {children}
    </button>
  );
}

function QuestTile({
  quest,
  attempts,
  avg,
  lucidCount,
  currentWeek,
  onOpen,
  onTrackToggle,
}: {
  quest: Quest;
  attempts: number;
  avg: number | null;
  lucidCount: number;
  currentWeek: number;
  onOpen: () => void;
  onTrackToggle: () => void;
}) {
  const reason = lockReason(quest, lucidCount, currentWeek);
  return (
    <div
      id={quest.slug}
      className={cn(
        "relative rounded-2xl border p-5 transition-all duration-300 quest-surface",
        quest.is_tracked && "border-quest-accent/55 shadow-quest-glow-soft",
        !quest.is_tracked && quest.unlocked && "hover:border-quest-accent/35",
        !quest.unlocked && "opacity-55",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={!quest.unlocked}
        className="w-full text-left disabled:cursor-not-allowed quest-focus-ring rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                quest.is_completed
                  ? "bg-quest-accent/20 text-quest-accentSoft"
                  : "bg-quest-surfaceStrong text-quest-accent",
              )}
            >
              {quest.is_completed ? "✓" : TIER_GLYPHS[quest.tier] ?? "✦"}
            </span>
            <div className="min-w-0">
              <p className="text-lg text-quest-ink truncate">
                {quest.unlocked ? quest.name : "Locked"}
              </p>
              <p className="font-mono uppercase tracking-ritual text-[9px] text-quest-inkMuted mt-0.5">
                {quest.category}
              </p>
            </div>
          </div>
          {quest.is_tracked && (
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-quest-gold/15 text-quest-gold border border-quest-gold/30">
              Tracking
            </span>
          )}
        </div>

        {quest.unlocked ? (
          <p className="text-sm text-quest-inkSoft mt-3 line-clamp-2 leading-relaxed">
            {quest.description}
          </p>
        ) : (
          <p className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkMuted mt-3">
            {reason}
          </p>
        )}

        {quest.is_tracked && !quest.is_completed && (
          <div className="mt-4">
            <div className="h-1.5 bg-quest-border/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-quest-accent to-quest-accentSoft transition-[width] duration-500"
                style={{ width: `${quest.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-quest-inkMuted mt-1.5 tabular-nums">
              {quest.progress}% complete
            </p>
          </div>
        )}

        {attempts > 0 && (
          <p className="mt-3 font-mono uppercase tracking-ritual text-[9px] text-quest-gold">
            Attempted {attempts}× · {avg?.toFixed(1) ?? "—"}/5
          </p>
        )}
      </button>

      {quest.unlocked && (
        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-quest-border/40">
          <button
            type="button"
            onClick={onTrackToggle}
            className={cn(
              "text-xs font-semibold rounded-full px-3 py-1.5 transition-colors quest-focus-ring",
              quest.is_tracked
                ? "bg-quest-accent/15 text-quest-accentSoft hover:bg-quest-accent/25"
                : "bg-quest-surfaceStrong/60 text-quest-accent hover:bg-quest-surfaceStrong",
            )}
          >
            {quest.is_tracked ? "Tracking ✓" : "Take on"}
          </button>
          {quest.weeks.length > 0 && (
            <p className="text-[10px] text-quest-inkMuted">
              W{quest.weeks[0]}
              {quest.weeks.length > 1 ? `–${quest.weeks[quest.weeks.length - 1]}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function QuestDetail({
  quest,
  userQuest,
  onClose,
  onTrackToggle,
  onProgress,
  onComplete,
  onLogAttempt,
  logging,
  error,
}: {
  quest: Quest | null;
  userQuest: UserQuest | undefined;
  onClose: () => void;
  onTrackToggle: () => void;
  onProgress: (progress: number) => void;
  onComplete: () => void;
  onLogAttempt: (rating: number, notes: string) => void;
  logging: boolean;
  error: string | null;
}) {
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");

  return (
    <AnimatePresence>
      {quest && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-void/85 backdrop-blur-md flex items-end md:items-center justify-center px-0 md:px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg quest-surface-strong border-t md:rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkMuted">
                Tier {quest.tier} · {quest.category}
              </p>
              {quest.is_tracked && (
                <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-quest-gold/15 text-quest-gold border border-quest-gold/30">
                  Tracking
                </span>
              )}
            </div>
            <h2 className="text-3xl text-quest-ink mt-2">{quest.name}</h2>
            <p className="text-quest-inkSoft mt-4 leading-relaxed">
              {quest.description}
            </p>
            {quest.incantation && (
              <p className="italic text-quest-accentSoft mt-4 border-l-2 border-quest-accent/40 pl-4">
                "{quest.incantation}"
              </p>
            )}

            {quest.prerequisites.length > 0 && (
              <p className="mt-4 text-[11px] text-quest-inkMuted">
                Requires: {quest.prerequisites.join(" · ")}
              </p>
            )}

            {/* Tracking controls */}
            <div className="mt-6 pt-5 border-t border-quest-border/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkMuted">
                  {quest.is_tracked ? "Tracked in your rail" : "Add to your rail"}
                </p>
                <button
                  type="button"
                  onClick={onTrackToggle}
                  className={cn(
                    "text-xs font-semibold rounded-full px-3.5 py-1.5 transition-colors quest-focus-ring",
                    quest.is_tracked
                      ? "bg-quest-accent/15 text-quest-accentSoft hover:bg-quest-accent/25"
                      : "bg-quest-accent text-quest-base hover:bg-quest-accentSoft",
                  )}
                >
                  {quest.is_tracked ? "Untrack" : "Take on"}
                </button>
              </div>

              {quest.is_tracked && userQuest && !quest.is_completed && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkSoft">
                      Progress {quest.progress}%
                    </span>
                    <button
                      type="button"
                      onClick={onComplete}
                      className="text-[10px] font-semibold uppercase tracking-wide text-quest-accent hover:text-quest-accentSoft transition-colors"
                    >
                      Mark complete
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={quest.progress}
                    onChange={(e) => onProgress(Number(e.target.value))}
                    className="w-full accent-quest-accent"
                  />
                </div>
              )}
            </div>

            {/* Log attempt */}
            <div className="mt-6 pt-5 border-t border-quest-border/40 space-y-3">
              <p className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkMuted">
                Log an attempt
              </p>
              <div>
                <span className="font-mono uppercase tracking-ritual text-[10px] text-quest-inkSoft mb-2 block">
                  Success {rating}/5
                </span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full accent-quest-accent"
                />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What happened?"
                rows={3}
                className="w-full bg-quest-base/40 border border-quest-border/50 rounded-md px-4 py-3 text-quest-ink placeholder:text-quest-inkMuted/70 focus:outline-none focus:border-quest-accent/60 resize-y"
              />
              {error && (
                <p className="font-mono text-[10px] text-accent-rose">{error}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={() => onLogAttempt(rating, notes)}
                  loading={logging}
                >
                  Inscribe attempt
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
