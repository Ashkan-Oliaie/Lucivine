import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ChakraGlyph } from "@/components/chakras/ChakraGlyph";
import { ChakraPracticeOrb } from "@/components/chakras/ChakraPracticeOrb";
import { ChakraPracticeClouds } from "@/components/visuals/ChakraPracticeClouds";
import { createChakraSession, fetchChakras } from "@/api/meditation";
import type { ChakraId } from "@/api/types";
import { extractMessage } from "@/api/client";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

const PRESET_MINUTES = [5, 10, 15, 20];

type SessionKind = "timed" | "free";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s}s`;
}

export default function ChakraSessionPage() {
  const { id } = useParams<{ id: ChakraId }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: chakras } = useQuery({
    queryKey: ["chakras"],
    queryFn: fetchChakras,
    staleTime: 60 * 60_000,
  });
  const chakra = chakras?.find((c) => c.id === id);

  const [kind, setKind] = useState<SessionKind>("timed");
  const [targetSeconds, setTargetSeconds] = useState(10 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "completing">("idle");

  const submittedRef = useRef(false);

  useEffect(() => {
    submittedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (phase !== "running") return;
    const idWin = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (kind === "timed" && next >= targetSeconds) return targetSeconds;
        return next;
      });
    }, 1000);
    return () => window.clearInterval(idWin);
  }, [phase, kind, targetSeconds]);

  const save = useMutation({
    mutationFn: createChakraSession,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["chakra-stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success({
        title: "Session saved",
        description: `${formatDuration(variables.duration_seconds)} logged${
          chakra ? ` · ${chakra.english}` : ""
        }`,
      });
      navigate("/chakras/root");
    },
    onError: (err) => {
      submittedRef.current = false;
      setPhase((p) => (p === "completing" ? "running" : p));
      toast.error({
        title: "Couldn't save session",
        description: extractMessage(err),
      });
    },
  });

  useEffect(() => {
    if (!chakra) return;
    if (phase !== "running" || kind !== "timed") return;
    if (elapsed < targetSeconds) return;
    if (submittedRef.current || save.isPending) return;
    submittedRef.current = true;
    setPhase("completing");
    save.mutate({
      chakra_id: chakra.id,
      duration_seconds: targetSeconds,
      frequency_hz: chakra.frequency_hz,
      mantra: chakra.mantra,
      notes: "",
    });
  }, [chakra, elapsed, phase, kind, targetSeconds, save]);

  if (!chakra || !chakras?.length) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  const c = chakra;

  const remaining = Math.max(0, targetSeconds - elapsed);

  function resetSession() {
    submittedRef.current = false;
    setElapsed(0);
    setPhase("idle");
  }

  function submitFreeSession() {
    if (elapsed <= 0 || submittedRef.current || save.isPending) return;
    submittedRef.current = true;
    save.mutate({
      chakra_id: c.id,
      duration_seconds: elapsed,
      frequency_hz: c.frequency_hz,
      mantra: c.mantra,
      notes: "",
    });
  }

  function handleKindSwitch(next: SessionKind) {
    if (save.isPending) return;
    setKind(next);
    resetSession();
  }

  function abandon() {
    if (save.isPending) return;
    resetSession();
  }

  const orbDigits =
    kind === "timed"
      ? phase === "idle"
        ? formatTime(targetSeconds)
        : formatTime(remaining)
      : formatTime(elapsed);

  const orbCaption =
    kind === "timed"
      ? phase === "idle"
        ? "Target length"
        : phase === "completing"
          ? "Saving"
          : "Remaining"
      : phase === "idle"
        ? "Elapsed"
        : "Elapsed";

  return (
    <>
      <div className="relative z-[2] w-full flex flex-col flex-1 min-h-0 md:items-center">
      {/* Mobile: icon strip (rail lives in AppShell on md+) */}
      <nav
        className="md:hidden relative z-[50] flex flex-wrap justify-center gap-2 pb-4 pt-1 px-1 shrink-0 pointer-events-auto"
        aria-label="Chakra centers"
      >
        {chakras.map((ch) => {
          const isActive = ch.id === id;
          return (
            <NavLink
              key={ch.id}
              to={`/chakras/${ch.id}`}
              title={ch.english}
              className={cn(
                "relative z-[1] shrink-0 flex h-11 w-11 items-center justify-center rounded-full border transition-[border-color,box-shadow,background-color,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50 active:scale-[0.96]",
                !isActive &&
                  "border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]",
              )}
              style={
                isActive
                  ? {
                      borderColor: `${ch.color}dd`,
                      background: `radial-gradient(circle at 35% 28%, ${ch.color}88, ${ch.color}26 52%, transparent 72%)`,
                      boxShadow: `
                        0 0 36px -4px ${ch.color},
                        0 0 14px -2px ${ch.color}aa,
                        inset 0 0 28px -10px ${ch.color}aa,
                        inset 0 1px 0 rgba(255,255,255,0.14)
                      `,
                    }
                  : undefined
              }
            >
              {isActive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full motion-safe:animate-[nebula-pulse_4s_ease-in-out_infinite]"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${ch.color}66, transparent 70%)`,
                    filter: "blur(8px)",
                  }}
                />
              )}
              <ChakraGlyph
                id={ch.id}
                color="#fdfcff"
                accent={ch.color}
                animated={isActive}
                className={cn(
                  "relative z-[1] drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]",
                  isActive ? "h-7 w-7" : "h-6 w-6",
                )}
              />
            </NavLink>
          );
        })}
      </nav>

      {/* Compact vertical flow that fits within viewport height: kind toggle → orb (click to begin) → mantra + controls */}
      <div className="relative z-[3] flex min-h-0 w-full min-w-0 max-w-none flex-1 flex-col items-center justify-between gap-y-3 md:gap-y-4 px-3 sm:px-4 md:max-w-[min(52rem,calc(100vw-18rem))] lg:max-w-[min(56rem,calc(100vw-22rem))] lg:px-10 xl:px-12 pb-6 md:pb-8 lg:pb-10">
        {/* Kind toggle — fixed-height row reserves space for the preset chips so swapping doesn't jump */}
        <div className="relative z-[50] flex shrink-0 justify-center items-center gap-2 flex-wrap pointer-events-auto min-h-[2.5rem]">
          <button
            type="button"
            onClick={() => handleKindSwitch("timed")}
            className={cn(
              "relative px-3.5 py-1.5 rounded-full border text-[11px] md:text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50",
              kind === "timed"
                ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                : "border-white/14 bg-white/[0.06] text-white/[0.82] hover:border-white/24 hover:bg-white/[0.09] hover:text-white",
            )}
          >
            Timed
          </button>
          <button
            type="button"
            onClick={() => handleKindSwitch("free")}
            className={cn(
              "relative px-3.5 py-1.5 rounded-full border text-[11px] md:text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50",
              kind === "free"
                ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                : "border-white/14 bg-white/[0.06] text-white/[0.82] hover:border-white/24 hover:bg-white/[0.09] hover:text-white",
            )}
          >
            Open
          </button>

          <div
            className={cn(
              "ml-2 flex items-center gap-1.5 pl-2 border-l border-white/10 transition-opacity duration-200",
              phase === "idle" && kind === "timed"
                ? "opacity-100"
                : "opacity-0 pointer-events-none",
            )}
            aria-hidden={!(phase === "idle" && kind === "timed")}
          >
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTargetSeconds(m * 60)}
                tabIndex={phase === "idle" && kind === "timed" ? 0 : -1}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-[11px] md:text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50",
                  targetSeconds === m * 60
                    ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                    : "border-white/10 bg-white/[0.04] text-white/[0.78] hover:border-white/24 hover:text-white",
                )}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-[10] flex w-full flex-1 min-h-0 flex-col items-center justify-center overflow-visible pointer-events-none [&>*]:pointer-events-auto">
          <div className="relative flex items-center justify-center">
            {/* Clouds anchored to orb center — covers the orb with surrounding ambient halo */}
            <ChakraPracticeClouds
              key={`chakra-ambient-${c.id}`}
              accent={c.color}
              seedKey={c.id}
              intense={phase === "running" || phase === "completing"}
            />
            <ChakraPracticeOrb
              chakraId={c.id}
              accent={c.color}
              phase={phase === "completing" ? "running" : phase}
              orbDigits={orbDigits}
              caption={orbCaption}
              onActivate={
                phase === "idle"
                  ? () => {
                      resetSession();
                      setElapsed(0);
                      setPhase("running");
                    }
                  : undefined
              }
              activateLabel={kind === "timed" ? "tap to begin" : "tap to start"}
            />
          </div>
        </div>

        {/* Mantra + controls — controls row has reserved height so swapping states never reflows */}
        <div className="relative z-[40] flex w-full flex-col items-center gap-2.5 md:gap-3 shrink-0 pointer-events-auto">
          <p className="text-center text-[12px] md:text-[13px] text-ink-secondary italic leading-snug">
            {c.mantra}
            <span className="not-italic text-ink-muted">
              {" "}· {c.frequency_hz} Hz
            </span>
          </p>

          <div className="flex flex-col items-center gap-2 min-h-[3.25rem] w-full">
            {phase === "running" && kind === "timed" && (
              <div className="flex justify-center gap-2 flex-wrap">
                <Button variant="soft" size="md" onClick={() => setPhase("paused")} className="min-w-[7rem]">
                  Pause
                </Button>
                <Button variant="ghost" size="md" onClick={abandon} className="min-w-[7rem]">
                  Cancel
                </Button>
              </div>
            )}

            {phase === "running" && kind === "free" && (
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  size="md"
                  onClick={submitFreeSession}
                  loading={save.isPending}
                  className="min-w-[7rem]"
                >
                  Save
                </Button>
                <Button variant="ghost" size="md" onClick={abandon} disabled={save.isPending} className="min-w-[7rem]">
                  Discard
                </Button>
              </div>
            )}

            {phase === "paused" && (
              <div className="flex justify-center gap-2 flex-wrap">
                <Button size="md" onClick={() => setPhase("running")} className="min-w-[7rem]">
                  Resume
                </Button>
                <Button variant="ghost" size="md" onClick={abandon} className="min-w-[7rem]">
                  Cancel
                </Button>
              </div>
            )}

            {phase === "completing" && (
              <div className="flex justify-center gap-2 flex-wrap">
                <Button size="md" loading className="min-w-[7rem]">
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
