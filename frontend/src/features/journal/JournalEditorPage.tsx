import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
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
const PRESET_EMOTION_SET: ReadonlySet<string> = new Set(PRESET_EMOTIONS);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
  const toast = useToast();

  const { data: existing, isLoading: loadingEntry } = useQuery({
    queryKey: ["dream", id],
    queryFn: () => fetchDream(id!),
    enabled: !isNew,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      toast.success({
        title: isNew ? "Dream inscribed" : "Entry updated",
        description: saved.title || "Your recall has been saved.",
      });
      navigate("/journal");
    },
    onError: (err) => {
      const msg = extractMessage(err);
      setError(msg);
      toast.error({ title: "Could not save", description: msg });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteDream(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success({ title: "Entry released" });
      navigate("/journal", { replace: true });
    },
    onError: (err) =>
      toast.error({
        title: "Could not delete",
        description: extractMessage(err),
      }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Give this dream a title.");
      toast.error({ title: "Title is required" });
      return;
    }
    const payload: Partial<DreamEntry> = { ...form, title: form.title.trim() };
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

  const saving = save.isPending;
  const deleting = remove.isPending;

  if (!isNew && loadingEntry) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="ritual-eyebrow mb-3">Recalling</p>
        <p className="italic text-ink-secondary">Listening to the entry…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto pb-32 md:pb-12"
    >
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="ritual-eyebrow">{isNew ? "New entry" : "Editing"}</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-light text-ink-primary leading-tight">
            {isNew ? (
              <>Inscribe what the <em className="text-accent-lavender">night</em> revealed</>
            ) : (
              <>Refine the <em className="text-accent-lavender">memory</em></>
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {formatDateLong(form.dream_date)}
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <Section>
          <input
            required
            autoFocus={isNew}
            placeholder="Title this dream…"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-transparent border-b border-white/10 pb-3 text-2xl md:text-3xl font-semibold tracking-tight text-ink-primary placeholder:text-ink-muted/50 placeholder:font-normal focus:outline-none focus:border-accent-lavender/60 transition-colors"
          />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 sm:gap-5 sm:items-center">
            <FieldLabel className="!mb-0 sm:pt-2">Date</FieldLabel>
            <input
              type="date"
              value={form.dream_date}
              onChange={(e) => setForm({ ...form, dream_date: e.target.value })}
              className="w-full sm:w-auto bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:border-accent-lavender/60 focus:bg-white/[0.05] transition-colors"
            />
          </div>
        </Section>

        <Section>
          <div className="flex items-baseline justify-between mb-3">
            <FieldLabel className="!mb-0">Recall</FieldLabel>
            <span className="text-[11px] tabular-nums text-ink-muted">
              {form.content.length} chars
            </span>
          </div>
          <textarea
            placeholder="Write before it dissolves…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={9}
            className="w-full bg-white/[0.025] border border-white/10 rounded-xl px-4 py-3.5 md:px-5 md:py-4 text-[15px] md:text-base text-ink-primary placeholder:text-ink-muted/55 leading-relaxed focus:outline-none focus:border-accent-lavender/60 focus:bg-white/[0.04] transition-colors resize-y min-h-[200px]"
          />
        </Section>

        <Section>
          <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
            <div className="min-w-0">
              <p className="text-base md:text-lg font-medium text-ink-primary">
                I became lucid
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Mark this entry as a lucid dream to capture technique & stages.
              </p>
            </div>
            <ToggleSwitch
              checked={form.is_lucid}
              onChange={(v) => setForm({ ...form, is_lucid: v })}
            />
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
                <div className="mt-6 space-y-6 pl-4 md:pl-5 border-l-2 border-accent-amethyst/30">
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
                        {form.vividness}
                        <span className="text-ink-muted">/10</span>
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
                    <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-ink-muted">
                      <span>faint</span>
                      <span>vivid</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Transition stages reached</FieldLabel>
                    <div className="grid grid-cols-8 gap-1.5 sm:gap-2 max-w-sm">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleStage(s)}
                          aria-pressed={form.transition_stages_reached.includes(s)}
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
        </Section>

        <Section>
          <FieldLabel>Emotions</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_EMOTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => togglePresetEmotion(em)}
                aria-pressed={form.emotions.includes(em)}
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
            values={form.emotions.filter((e) => !PRESET_EMOTION_SET.has(e))}
            onChange={(custom) =>
              setForm({
                ...form,
                emotions: [
                  ...form.emotions.filter((e) => PRESET_EMOTION_SET.has(e)),
                  ...custom,
                ],
              })
            }
          />
        </Section>

        <Section>
          <ChipInput
            label="Symbols"
            values={form.symbols}
            onChange={(v) => setForm({ ...form, symbols: v })}
          />
        </Section>

        {error && (
          <p className="text-sm text-accent-rose bg-accent-rose/[0.06] border border-accent-rose/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-void/90 backdrop-blur-md px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 flex items-center gap-3">
          {!isNew && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-medium text-accent-rose px-2 py-2 disabled:opacity-50"
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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {isNew ? "Inscribe" : "Save"}
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between gap-3 pt-2">
          {!isNew ? (
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-medium uppercase tracking-wider text-accent-rose hover:underline disabled:opacity-50"
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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isNew ? "Inscribe" : "Save"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          remove.mutate();
        }}
        title="Release this dream?"
        description="The entry will be permanently removed from your journal."
        confirmLabel="Delete"
        loading={deleting}
        tone="danger"
      />
    </motion.div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 md:p-6 transition-colors hover:border-white/[0.1]">
      {children}
    </section>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
        checked
          ? "border-accent-lavender/60 bg-accent-amethyst/40"
          : "border-white/10 bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-ink-primary shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
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
      <FieldLabel>{label}</FieldLabel>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-sm text-ink-primary hover:border-accent-rose/40 hover:bg-accent-rose/[0.06] transition-colors"
            >
              <span>{v}</span>
              <span
                aria-hidden
                className="text-ink-muted group-hover:text-accent-rose"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}
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
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={!input.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
