import { useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = rose accent on primary confirm */
  tone?: "danger" | "neutral";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Modal confirm — replaces window.confirm for destructive or sensitive actions.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading,
  onConfirm,
  onClose,
}: Props) {
  const titleId = useId();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-void/85 p-4 backdrop-blur-md md:p-6"
          onClick={loading ? undefined : onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-xl border border-white/10 bg-deep p-6 shadow-glow md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p id={titleId} className="text-lg text-ink-primary">
              {title}
            </p>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{description}</p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={tone === "danger" ? "primary" : "outline"}
                loading={loading}
                className={
                  tone === "danger"
                    ? "!bg-accent-rose/90 !from-accent-rose !to-accent-rose/80 hover:!brightness-110"
                    : undefined
                }
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
