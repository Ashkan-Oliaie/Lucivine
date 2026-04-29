import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { createRealityCheck } from "@/api/realityChecks";
import type { RealityCheckMethod } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";

type MethodInfo = { id: RealityCheckMethod; label: string; glyph: string; hint: string };

const METHODS: MethodInfo[] = [
  { id: "hand", label: "Hand", glyph: "✋", hint: "Count your fingers — twice." },
  { id: "nose", label: "Nose pinch", glyph: "👃", hint: "Pinch nose, try to breathe through it." },
  { id: "text", label: "Text", glyph: "📖", hint: "Read text, look away, read again." },
  { id: "clock", label: "Clock", glyph: "⏱", hint: "Glance, look away, glance back." },
  { id: "light", label: "Light", glyph: "💡", hint: "Try the light switch — does it work?" },
  { id: "mirror", label: "Mirror", glyph: "🪞", hint: "Reflections lie in dreams." },
  { id: "memory", label: "Memory", glyph: "🧠", hint: "How did I get here?" },
  { id: "jump", label: "Jump", glyph: "↟", hint: "Try to float on the way down." },
];

export function QuickRC({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [done, setDone] = useState<RealityCheckMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const log = useMutation({
    mutationFn: (method: RealityCheckMethod) => createRealityCheck({ method }),
    onSuccess: (_data, method) => {
      setDone(method);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["realityStats"] });
      setTimeout(() => {
        setDone(null);
        onClose();
      }, 900);
    },
    onError: (err) => setError(extractMessage(err)),
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!log.isPending) {
          setDone(null);
          setError(null);
          onClose();
        }
      }}
      eyebrow="Am I dreaming?"
      title="Reality check"
      size="md"
    >
      <p className=" italic text-ink-secondary mb-6">
        Pause. Question waking life with the same care you'd give a dream.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METHODS.map((m) => {
          const isDone = done === m.id;
          return (
            <motion.button
              key={m.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={log.isPending}
              onClick={() => log.mutate(m.id)}
              className={cn(
                "relative group rounded-2xl p-4 border transition-all text-left",
                isDone
                  ? "border-accent-mint bg-accent-mint/15"
                  : "border-white/10 bg-white/[0.03] hover:border-accent-lavender/40 hover:bg-white/[0.06]",
              )}
            >
              <div className="text-2xl mb-2">{isDone ? "✓" : m.glyph}</div>
              <p className=" text-base text-ink-primary leading-tight">
                {m.label}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted mt-2 leading-snug">
                {m.hint}
              </p>
            </motion.button>
          );
        })}
      </div>
      {error && (
        <p className="mt-4 font-mono text-[11px] text-accent-rose">{error}</p>
      )}
    </Modal>
  );
}
