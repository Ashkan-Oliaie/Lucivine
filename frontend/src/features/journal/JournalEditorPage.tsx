import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-3">
        {isNew ? "New entry" : "Entry"}
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <input
          required
          autoFocus={isNew}
          placeholder="Title…"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-transparent border-b border-white/10 pb-3 text-3xl md:text-4xl text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/40"
        />

        <Input
          label="Date"
          type="date"
          value={form.dream_date}
          onChange={(e) => setForm({ ...form, dream_date: e.target.value })}
        />

        <div>
          <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
            Recall
          </span>
          <textarea
            placeholder="Write before it dissolves…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={10}
            className="w-full bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-base md:text-lg text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60 resize-y"
          />
        </div>

        <Card>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_lucid}
              onChange={(e) => setForm({ ...form, is_lucid: e.target.checked })}
              className="w-5 h-5 accent-accent-amethyst"
            />
            <span className=" text-lg text-ink-primary">
              I became lucid
            </span>
          </label>

          {form.is_lucid && (
            <div className="mt-6 space-y-4 pl-8 border-l border-accent-amethyst/30">
              <div>
                <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
                  Technique
                </span>
                <div className="flex flex-wrap gap-2">
                  {TECHNIQUES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, technique_used: t })}
                      className={cn(
                        "px-4 py-2 rounded-md border font-mono uppercase tracking-ritual text-[10px] transition-colors",
                        form.technique_used === t
                          ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                          : "border-white/10 text-ink-secondary",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
                  Vividness {form.vividness}/10
                </span>
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
                <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
                  Transition stages reached
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStage(s)}
                      className={cn(
                        "w-10 h-10 rounded-full border font-mono text-sm transition-colors",
                        form.transition_stages_reached.includes(s)
                          ? "border-accent-lavender bg-accent-lavender/20 text-ink-primary"
                          : "border-white/10 text-ink-secondary",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div>
          <span className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-2 block">
            Emotions
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_EMOTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => togglePresetEmotion(em)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs transition-colors",
                  form.emotions.includes(em)
                    ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                    : "border-white/10 text-ink-secondary hover:border-white/25",
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

        {error && <p className="font-mono text-[10px] text-accent-rose">{error}</p>}

        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 pt-4">
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this dream entry?")) remove.mutate();
              }}
              className="font-mono uppercase tracking-ritual text-[10px] text-accent-rose hover:underline self-start"
            >
              Delete
            </button>
          )}
          <div className="flex gap-3 md:ml-auto">
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
