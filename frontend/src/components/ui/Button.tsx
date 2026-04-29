import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline" | "soft";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void active:scale-[0.97]";

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "text-ink-primary bg-gradient-to-br from-accent-amethyst to-accent-rose/80 shadow-[0_8px_24px_-12px_rgba(124,92,255,0.7)] hover:shadow-[0_12px_32px_-10px_rgba(255,137,184,0.6)] hover:brightness-110",
  soft:
    "text-ink-primary bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] hover:border-accent-lavender/40",
  ghost:
    "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.06]",
  outline:
    "border border-accent-lavender/30 text-ink-secondary hover:border-accent-lavender hover:text-ink-primary hover:bg-accent-lavender/[0.06]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex gap-1">
          <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
          <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:120ms]" />
          <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:240ms]" />
        </span>
      ) : (
        children
      )}
    </button>
  );
});
