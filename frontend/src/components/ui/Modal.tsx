import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export function Modal({ open, onClose, title, eyebrow, children, size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/70 backdrop-blur-md"
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-[1] w-full pointer-events-auto",
              sizes[size],
              "max-h-[85vh] overflow-hidden flex flex-col",
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="glass-strong rounded-2xl shadow-glow flex flex-col max-h-[85vh] overflow-hidden">
              {(eyebrow || title) && (
                <div className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
                  {eyebrow && <p className="ritual-eyebrow mb-2">{eyebrow}</p>}
                  {title && (
                    <h2 className="text-2xl md:text-3xl text-ink-primary">
                      {title}
                    </h2>
                  )}
                </div>
              )}
              <div className="overflow-y-auto px-6 py-6">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
