import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: "glass" | "solid" | "outline";
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { className, variant = "glass", interactive = false, ...rest },
  ref,
) {
  const base = "rounded-2xl p-5 md:p-6 transition-all duration-300";
  const variants = {
    glass: "glass shadow-glow-soft",
    solid: "bg-deep/60 border border-white/10",
    outline: "border border-white/10",
  } as const;
  const hover = interactive
    ? "hover:border-accent-lavender/30 hover:shadow-glow hover:-translate-y-0.5 cursor-pointer"
    : "";
  return (
    <div
      ref={ref}
      className={cn(base, variants[variant], hover, className)}
      {...rest}
    />
  );
});
