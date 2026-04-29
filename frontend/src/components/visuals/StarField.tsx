import { useMemo } from "react";

type Props = { count?: number };

export function StarField({ count = 90 }: Props) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 5,
        opacity: 0.4 + Math.random() * 0.6,
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2] overflow-hidden"
    >
      {/* drifting orbs for depth */}
      <div className="absolute top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-accent-amethyst/12 blur-3xl animate-drift" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-accent-rose/8 blur-3xl animate-drift-slow" />
      <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-accent-azure/8 blur-3xl animate-drift" />

      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-ink-primary animate-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: s.size > 1.2 ? `0 0 ${s.size * 4}px rgba(255,255,255,0.5)` : undefined,
          }}
        />
      ))}
    </div>
  );
}
