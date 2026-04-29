import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { castSpell, fetchGrimoire, fetchSpellList } from "@/api/spells";
import type { Spell } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";

export default function SpellsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Spell | null>(null);
  const [castError, setCastError] = useState<string | null>(null);

  const { data: list } = useQuery({
    queryKey: ["spells"],
    queryFn: fetchSpellList,
  });

  const { data: grimoire } = useQuery({
    queryKey: ["grimoire"],
    queryFn: fetchGrimoire,
  });

  const cast = useMutation({
    mutationFn: castSpell,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grimoire"] });
      qc.invalidateQueries({ queryKey: ["spells"] });
      setCastError(null);
      setSelected(null);
    },
    onError: (err) => setCastError(extractMessage(err)),
  });

  const grimoireBySlug = new Map(grimoire?.map((g) => [g.spell.slug, g]) ?? []);

  const tiers = [1, 2, 3, 4, 5];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-3">
        Grimoire
      </p>
      <h1 className=" text-4xl md:text-5xl font-light text-ink-primary">
        Bend the dream <em className="text-accent-lavender">to your will</em>.
      </h1>
      <p className=" italic text-ink-secondary text-base md:text-lg mt-4 max-w-xl">
        Spells unlock as your lucid count grows. {list?.lucid_count ?? 0} unlocked
        through practice.
      </p>

      <div className="mt-12 space-y-12">
        {tiers.map((tier) => {
          const tierSpells = list?.results.filter((s) => s.tier === tier) ?? [];
          if (tierSpells.length === 0) return null;
          return (
            <section key={tier}>
              <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted mb-4">
                Tier {tier}
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tierSpells.map((spell) => {
                  const cast = grimoireBySlug.get(spell.slug);
                  return (
                    <li key={spell.id}>
                      <button
                        onClick={() => setSelected(spell)}
                        disabled={!spell.unlocked}
                        className={cn(
                          "w-full text-left rounded-lg border p-5 transition-all duration-300",
                          spell.unlocked
                            ? "border-white/10 hover:border-accent-lavender/40 hover:bg-white/[0.02] hover:shadow-[0_0_40px_-20px_theme(colors.accent.amethyst)]"
                            : "border-white/5 bg-transparent opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className=" text-lg text-ink-primary">
                            {spell.unlocked ? spell.name : "✦ ✦ ✦"}
                          </p>
                          <p className="font-mono uppercase tracking-ritual text-[9px] text-ink-muted shrink-0">
                            {spell.category}
                          </p>
                        </div>
                        {spell.unlocked ? (
                          <p className=" text-sm text-ink-secondary mt-2 line-clamp-2">
                            {spell.description}
                          </p>
                        ) : (
                          <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted mt-2">
                            {spell.unlock_threshold} lucid dream(s) to unlock
                          </p>
                        )}
                        {cast && (
                          <p className="mt-3 font-mono uppercase tracking-ritual text-[9px] text-accent-amber">
                            Cast {cast.casts.length}× ·{" "}
                            {cast.avg_success?.toFixed(1)}/5
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <SpellDetail
        spell={selected}
        onClose={() => {
          setSelected(null);
          setCastError(null);
        }}
        onCast={(rating, notes) =>
          selected &&
          cast.mutate({
            spell: selected.id,
            success_rating: rating,
            notes: notes || undefined,
          })
        }
        casting={cast.isPending}
        error={castError}
      />
    </motion.div>
  );
}

function SpellDetail({
  spell,
  onClose,
  onCast,
  casting,
  error,
}: {
  spell: Spell | null;
  onClose: () => void;
  onCast: (rating: number, notes: string) => void;
  casting: boolean;
  error: string | null;
}) {
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");

  return (
    <AnimatePresence>
      {spell && (
        <>
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
              className="w-full max-w-lg bg-deep border-t md:border border-white/10 md:rounded-lg p-6 md:p-8 max-h-[85vh] overflow-y-auto"
            >
              <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted">
                Tier {spell.tier} · {spell.category}
              </p>
              <h2 className=" text-3xl text-ink-primary mt-2">
                {spell.name}
              </h2>
              <p className=" text-ink-secondary mt-4 leading-relaxed">
                {spell.description}
              </p>
              {spell.incantation && (
                <p className=" italic text-accent-lavender mt-4 border-l-2 border-accent-amethyst/40 pl-4">
                  "{spell.incantation}"
                </p>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted">
                  Mark a cast in your dream
                </p>
                <div>
                  <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
                    Success {rating}/5
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full accent-accent-amethyst"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What happened?"
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60 resize-y"
                />
                {error && (
                  <p className="font-mono text-[10px] text-accent-rose">{error}</p>
                )}
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    onClick={() => onCast(rating, notes)}
                    loading={casting}
                  >
                    Inscribe cast
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
