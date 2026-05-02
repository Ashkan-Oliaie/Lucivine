import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
};

type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  success: (input: ToastInput | string) => string;
  error: (input: ToastInput | string) => string;
  info: (input: ToastInput | string) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3600;

function normalize(input: ToastInput | string): ToastInput {
  return typeof input === "string" ? { title: input } : input;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, raw: ToastInput | string) => {
      const data = normalize(raw);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = data.duration ?? DEFAULT_DURATION;
      const toast: Toast = {
        id,
        variant,
        title: data.title,
        description: data.description,
        duration,
      };
      setToasts((prev) => [...prev, toast].slice(-4));
      const handle = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, handle);
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (i) => push("success", i),
      error: (i) => push("error", i),
      info: (i) => push("info", i),
      dismiss,
    }),
    [push, dismiss],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((h) => window.clearTimeout(h));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),1rem)] sm:items-end sm:px-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-accent-mint/35 shadow-[0_18px_50px_-22px_rgba(122,255,209,0.55)]",
  error:
    "border-accent-rose/40 shadow-[0_18px_50px_-22px_rgba(255,137,184,0.55)]",
  info:
    "border-accent-lavender/35 shadow-[0_18px_50px_-22px_rgba(184,168,255,0.55)]",
};

const variantAccent: Record<ToastVariant, string> = {
  success: "bg-gradient-to-b from-accent-mint to-accent-azure",
  error: "bg-gradient-to-b from-accent-rose to-accent-amethyst",
  info: "bg-gradient-to-b from-accent-lavender to-accent-azure",
};

const variantGlyph: Record<ToastVariant, string> = {
  success: "✓",
  error: "!",
  info: "✶",
};

const variantGlyphColor: Record<ToastVariant, string> = {
  success: "text-accent-mint",
  error: "text-accent-rose",
  info: "text-accent-lavender",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-void/85 backdrop-blur-xl",
        variantStyles[toast.variant],
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn("absolute inset-y-0 left-0 w-[3px]", variantAccent[toast.variant])} />
      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        <span
          className={cn(
            "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold",
            variantGlyphColor[toast.variant],
          )}
          aria-hidden
        >
          {variantGlyph[toast.variant]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-ink-primary">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink-primary"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>
      </div>
    </motion.div>
  );
}
