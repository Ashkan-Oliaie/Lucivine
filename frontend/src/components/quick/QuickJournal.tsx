import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createDream } from "@/api/journal";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";
import type { Technique } from "@/api/types";

const TECHNIQUES: Technique[] = ["DILD", "WILD", "MILD", "WBTB", "SSILD", "other"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickJournal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLucid, setIsLucid] = useState(false);
  const [technique, setTechnique] = useState<Technique | "">("");
  const [vividness, setVividness] = useState(5);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setContent("");
    setIsLucid(false);
    setTechnique("");
    setVividness(5);
    setError(null);
  }

  const save = useMutation({
    mutationFn: () =>
      createDream({
        title: title || "Untitled dream",
        content,
        dream_date: todayISO(),
        is_lucid: isLucid,
        technique_used: isLucid ? technique : "",
        vividness: isLucid ? vividness : null,
      }),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      onClose();
      navigate(`/journal/${saved.id}`);
    },
    onError: (err) => setError(extractMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    save.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!save.isPending) {
          reset();
          onClose();
        }
      }}
      eyebrow="Capture before it dissolves"
      title="Inscribe a dream"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <input
          autoFocus
          placeholder="Title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-b border-white/10 pb-3 text-2xl text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60 transition-colors"
        />

        <textarea
          placeholder="What did you remember?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-base text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60 focus:bg-white/[0.05] resize-y transition-colors"
        />

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isLucid}
            onChange={(e) => setIsLucid(e.target.checked)}
            className="w-5 h-5 accent-accent-amethyst rounded"
          />
          <span className=" text-lg text-ink-primary">I became lucid</span>
        </label>

        {isLucid && (
          <div className="pl-8 border-l-2 border-accent-amethyst/40 space-y-4 animate-fade-up">
            <div>
              <span className="ritual-eyebrow mb-2 block">Technique</span>
              <div className="flex flex-wrap gap-2">
                {TECHNIQUES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTechnique(t)}
                    className={cn(
                      "px-4 py-2 rounded-full border font-mono uppercase tracking-ritual text-[10px] transition-all",
                      technique === t
                        ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                        : "border-white/10 text-ink-secondary hover:border-accent-lavender/40",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="ritual-eyebrow">Vividness</span>
                <span className="font-mono text-sm text-ink-secondary">{vividness}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={vividness}
                onChange={(e) => setVividness(Number(e.target.value))}
                className="w-full accent-accent-amethyst"
              />
            </div>
          </div>
        )}

        {error && <p className="font-mono text-[11px] text-accent-rose">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Inscribe
          </Button>
        </div>
      </form>
    </Modal>
  );
}
