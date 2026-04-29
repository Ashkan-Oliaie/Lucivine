import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import {
  createRealityCheck,
  fetchRealityStats,
  listRealityChecks,
} from "@/api/realityChecks";
import type { RealityCheckMethod } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";

const METHODS: { id: RealityCheckMethod; label: string; cue: string }[] = [
  { id: "hand", label: "Hands", cue: "Count fingers slowly." },
  { id: "nose", label: "Breath", cue: "Pinch nose. Try to inhale." },
  { id: "text", label: "Text", cue: "Read words. Look away. Read again." },
  { id: "clock", label: "Clock", cue: "Read the time. Look away. Read again." },
  { id: "light", label: "Light", cue: "Flick the switch. Test reality." },
  { id: "mirror", label: "Mirror", cue: "Examine your reflection." },
  { id: "memory", label: "Memory", cue: "Recall the last hour." },
  { id: "jump", label: "Float", cue: "Jump and feel for gravity." },
];

export default function RealityPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["reality-stats"],
    queryFn: fetchRealityStats,
  });

  const { data: list } = useQuery({
    queryKey: ["reality-checks"],
    queryFn: listRealityChecks,
  });

  const create = useMutation({
    mutationFn: createRealityCheck,
    onMutate: () => setError(null),
    onSuccess: (rc) => {
      setJustLogged(rc.id);
      window.setTimeout(() => setJustLogged(null), 1500);
      qc.invalidateQueries({ queryKey: ["reality-checks"] });
      qc.invalidateQueries({ queryKey: ["reality-stats"] });
    },
    onError: (err) => setError(extractMessage(err, "Could not log check.")),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-3">
        Reality
      </p>
      <h1 className=" text-5xl md:text-6xl font-light text-ink-primary leading-tight">
        <em className="text-accent-lavender">Question</em> the waking world.
      </h1>
      <p className=" italic text-ink-secondary/80 text-lg mt-6 max-w-xl">
        Each check is a thread you tug — eventually one snaps and you wake within the dream.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
        {METHODS.map((m, i) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => create.mutate({ method: m.id })}
            disabled={create.isPending}
            className={cn(
              "group relative rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 text-left transition-all duration-300",
              "hover:border-accent-lavender/40 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-20px_theme(colors.accent.amethyst)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted">
              {m.label}
            </p>
            <p className=" text-ink-primary mt-3 leading-snug">{m.cue}</p>
            <AnimatePresence>
              {justLogged && create.variables?.method === m.id && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-ritual text-accent-amber"
                >
                  logged
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="font-mono text-[10px] text-accent-rose mt-6">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <Card>
          <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted mb-3">
            Today's count
          </p>
          <p className=" text-5xl text-ink-primary">
            {stats?.last_30_days_total ?? 0}
          </p>
          <p className=" italic text-sm text-ink-secondary mt-2">
            in the last 30 days
          </p>
        </Card>
        <Card>
          <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted mb-3">
            Recent
          </p>
          {list?.results?.length ? (
            <ul className="space-y-2">
              {list.results.slice(0, 6).map((rc) => (
                <li
                  key={rc.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-primary capitalize">{rc.method}</span>
                  <span className="font-mono text-[10px] text-ink-muted">
                    {new Date(rc.performed_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className=" italic text-ink-secondary">No checks logged yet.</p>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
