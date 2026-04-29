import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block">
      {label && (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-2 block">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-lg text-ink-primary placeholder:text-ink-muted/60 transition-colors duration-300 focus:outline-none focus:border-accent-lavender/60 focus:bg-white/[0.05]",
          error && "border-accent-rose/60",
          className,
        )}
        {...rest}
      />
      {error && (
        <span className="text-xs text-accent-rose mt-2 block">{error}</span>
      )}
    </label>
  );
});
