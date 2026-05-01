import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createDream,
  deleteDream,
  fetchDream,
  updateDream,
} from "@/api/journal";
import type { DreamEntry, Technique } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";
import { PRESET_EMOTIONS } from "@/lib/journalEmotions";

const TECHNIQUES: Technique[] = ["DILD", "WILD", "MILD", "WBTB", "SSILD", "other"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  title: string;
  content: string;
  dream_date: string;
  is_lucid: boolean;
  lucidity_duration_seconds: number | null;
  technique_used: Technique | "";
  vividness: number | null;
  emotions: string[];
  symbols: string[];
  transition_stages_reached: number[];
};

const EMPTY: FormState = {
  title: "",
  content: "",
  dream_date: todayISO(),
  is_lucid: false,
  lucidity_duration_seconds: null,
  technique_used: "",
  vividness: 5,
  emotions: [],
  symbols: [],
  transition_stages_reached: [],
};

export default function JournalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["dream", id],
    queryFn: () => fetchDream(id!),
    enabled: !isNew,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        content: existing.content,
        dream_date: existing.dream_date,
        is_lucid: existing.is_lucid,
        lucidity_duration_seconds: existing.lucidity_duration_seconds,
        technique_used: existing.technique_used,
        vividness: existing.vividness,
        emotions: existing.emotions,
        symbols: existing.symbols,
        transition_stages_reached: existing.transition_stages_reached,
      });
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: (input: Partial<DreamEntry>) =>
      isNew ? createDream(input) : updateDream(id!, input),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["dream", saved.id] });
      navigate(`/journal/${saved.id}`, { replace: true });
    },
    onError: (err) => setError(extractMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => deleteDream(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/journal", { replace: true });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Partial<DreamEntry> = { ...form };
    if (!form.is_lucid) {
      payload.lucidity_duration_seconds = null;
      payload.technique_used = "";
      payload.transition_stages_reached = [];
    }
    save.mutate(payload);
  }

  function toggleStage(stage: number) {
    setForm((f) => ({
      ...f,
      transition_stages_reached: f.transition_stages_reached.includes(stage)
        ? f.transition_stages_reached.filter((s) => s !== stage)
        : [...f.transition_stages_reached, stage].sort(),
    }));
  }

  function togglePresetEmotion(em: string) {
    setForm((f) => ({
      ...f,
      emotions: f.emotions.includes(em)
        ? f.emotions.filter((x) => x !== em)
        : [...f.emotions, em],
    }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto pb-24 md:pb-10"
    >
      <div className="flex items-center justify-between mb-5">
        <p className="ritual-eyebrow">{isNew ? "New entry" : "Entry"}</p>
        <p className="text-[11px] text-ink-muted tabular-nums">
          {form.dream_date}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-7 md:space-y-9">
        <div>
          <input
            required
            autoFocus={isNew}
            placeholder="Title this dream…"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-transparent border-b border-white/10 pb-3 text-2xl md:text-4xl font-semibold tracking-tight text-ink-primary placeholder:text-ink-muted/50 placeholder:font-normal focus:outline-none focus:border-accent-lavender/50 transition-colors"
          />
        </div>

        <FieldLabel>When</FieldLabel>
        <Input
          type="date"
          value={form.dream_date}
          onChange={(e) => setForm({ ...form, dream_date: e.target.value })}
          className="-mt-5"
        />

        <div>
          <FieldLabel>Recall</FieldLabel>
          <textarea
            placeholder="Write before it dissolves…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={9}
            className="w-full bg-white/[0.025] border border-white/10 rounded-xl px-4 py-3.5 md:px-5 md:py-4 text-[15px] md:text-base text-ink-primary placeholder:text-ink-muted/55 leading-relaxed focus:outline-none focus:border-accent-lavender/60 focus:bg-white/[0.04] transition-colors resize-y min-h-[180px]"
          />
        </div>

        <Card className="!p-5 md:!p-6">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_lucid}
              onChange={(e) => setForm({ ...form, is_lucid: e.target.checked })}
              className="w-5 h-5 accent-accent-amethyst"
            />
            <span className="text-base md:text-lg font-medium text-ink-primary">
              I became lucid
            </span>
          </label>

          <AnimatePresence initial={false}>
            {form.is_lucid && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-5 md:mt-6 space-y-5 md:space-y-6 pl-4 md:pl-6 border-l-2 border-accent-amethyst/30">
                  <div>
                    <FieldLabel>Technique</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {TECHNIQUES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, technique_used: t })}
                          className={cn(
                            "px-3.5 py-1.5 rounded-full border text-xs font-medium tracking-wide transition-colors",
                            form.technique_used === t
                              ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                              : "border-white/10 text-ink-secondary hover:border-white/25 hover:text-ink-primary",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <FieldLabel className="!mb-0">Vividness</FieldLabel>
                      <span className="text-sm tabular-nums text-ink-primary">
                        {form.vividness}<span className="text-ink-muted">/10</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={form.vividness ?? 5}
                      onChange={(e) =>
                        setForm({ ...form, vividness: Number(e.target.value) })
                      }
                      className="w-full accent-accent-amethyst"
                    />
                  </div>

                  <div>
                    <FieldLabel>Transition stages reached</FieldLabel>
                    <div className="grid grid-cols-8 gap-1.5 sm:gap-2 max-w-sm">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleStage(s)}
                          className={cn(
                            "aspect-square rounded-full border text-sm font-medium tabular-nums transition-colors",
                            form.transition_stages_reached.includes(s)
                              ? "border-accent-lavender bg-accent-lavender/20 text-ink-primary"
                              : "border-white/10 text-ink-secondary hover:border-white/25",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <div>
          <FieldLabel>Emotions</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_EMOTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => togglePresetEmotion(em)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                  form.emotions.includes(em)
                    ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                    : "border-white/10 text-ink-secondary hover:border-white/25 hover:text-ink-primary",
                )}
              >
                {em}
              </button>
            ))}
          </div>
          <ChipInput
            label="Custom feelings"
            values={form.emotions}
            onChange={(v) => setForm({ ...form, emotions: v })}
          />
        </div>

        <ChipInput
          label="Symbols"
          values={form.symbols}
          onChange={(v) => setForm({ ...form, symbols: v })}
        />

        {error && (
          <p className="text-sm text-accent-rose bg-accent-rose/[0.06] border border-accent-rose/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-void/85 backdrop-blur-md px-4 py-3 flex items-center gap-3">
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this dream entry?")) remove.mutate();
              }}
              className="text-xs font-medium text-accent-rose px-2 py-2"
            >
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/journal")}
            >
              Back
            </Button>
            <Button type="submit" size="sm" loading={save.isPending}>
              {isNew ? "Inscribe" : "Save"}
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between gap-3 pt-2">
          {!isNew ? (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this dream entry?")) remove.mutate();
              }}
              className="text-xs font-medium uppercase tracking-wider text-accent-rose hover:underline"
            >
              Delete entry
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/journal")}
            >
              Back
            </Button>
            <Button type="submit" loading={save.isPending}>
              {isNew ? "Inscribe" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted mb-2.5",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ChipInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput("");
  }

  return (
    <div>
      <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
        {label}
      </span>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-sm text-ink-primary hover:border-accent-rose/40"
          >
            {v} ×
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`Add ${label.toLowerCase()}…`}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-4 py-2 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60"
        />
        <Button type="button" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
