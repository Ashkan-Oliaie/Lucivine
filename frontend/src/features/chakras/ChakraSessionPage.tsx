import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ChakraGlyph } from "@/components/chakras/ChakraGlyph";
import { ChakraPracticeOrb } from "@/components/chakras/ChakraPracticeOrb";
import { ChakraPracticeClouds } from "@/components/visuals/ChakraPracticeClouds";
import { createChakraSession, fetchChakras } from "@/api/meditation";
import type { ChakraId } from "@/api/types";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";

const PRESET_MINUTES = [5, 10, 15, 20];

type SessionKind = "timed" | "free";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getChakraAmbientMountEl(): HTMLElement | null {
  return document.getElementById("chakra-ambient-root");
}

export default function ChakraSessionPage() {
  const { id } = useParams<{ id: ChakraId }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: chakras } = useQuery({
    queryKey: ["chakras"],
    queryFn: fetchChakras,
    staleTime: 60 * 60_000,
  });
  const chakra = chakras?.find((c) => c.id === id);

  const [kind, setKind] = useState<SessionKind>("timed");
  const [targetSeconds, setTargetSeconds] = useState(10 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "paused">("idle");

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chakra-stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/chakras/root");
    },
  });

  useEffect(() => {
    if (!chakra) return;
    if (phase !== "running" || kind !== "timed") return;
    if (elapsed < targetSeconds) return;
    if (submittedRef.current || save.isPending) return;
    submittedRef.current = true;
    save.mutate(
      {
        chakra_id: chakra.id,
        duration_seconds: targetSeconds,
        frequency_hz: chakra.frequency_hz,
        mantra: chakra.mantra,
        notes: "",
      },
      {
        onError: () => {
          submittedRef.current = false;
        },
      },
    );
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
    save.mutate(
      {
        chakra_id: c.id,
        duration_seconds: elapsed,
        frequency_hz: c.frequency_hz,
        mantra: c.mantra,
        notes: "",
      },
      {
        onError: () => {
          submittedRef.current = false;
        },
      },
    );
  }

  function handleKindSwitch(next: SessionKind) {
    setKind(next);
    resetSession();
  }

  function abandon() {
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
        : "Remaining"
      : phase === "idle"
        ? "Elapsed"
        : "Elapsed";

  const ambientMount =
    typeof document !== "undefined" ? getChakraAmbientMountEl() : null;
  const ambientPortal =
    ambientMount &&
    createPortal(
      <ChakraPracticeClouds
        key={`chakra-ambient-${c.id}`}
        accent={c.color}
        seedKey={c.id}
        intense={phase === "running"}
      />,
      ambientMount,
    );

  return (
    <>
      {ambientPortal}
      <div className="relative z-[2] w-full flex flex-col flex-1 min-h-0 md:items-center">
      {/* Mobile: icon strip (rail lives in AppShell on md+) */}
      <nav
        className="md:hidden relative z-[50] flex flex-wrap justify-center gap-2 pb-4 pt-1 px-1 shrink-0 pointer-events-auto"
        aria-label="Chakra centers"
      >
        {chakras.map((ch) => (
          <NavLink
            key={ch.id}
            to={`/chakras/${ch.id}`}
            title={ch.english}
            className={({ isActive }) =>
              cn(
                "relative z-[1] shrink-0 flex h-11 w-11 items-center justify-center rounded-full border transition-[border-color,box-shadow,background-color,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50 active:scale-[0.96]",
                !isActive &&
                  "border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]",
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    borderColor: `${ch.color}dd`,
                    background: `radial-gradient(circle at 35% 28%, ${ch.color}66, ${ch.color}22 52%, transparent 72%)`,
                    boxShadow: `
                      0 0 26px -6px ${ch.color},
                      inset 0 0 28px -12px ${ch.color}77,
                      inset 0 1px 0 rgba(255,255,255,0.12)
                    `,
                  }
                : undefined
            }
          >
            <ChakraGlyph id={ch.id} color="#fdfcff" className="h-6 w-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
          </NavLink>
        ))}
      </nav>

      {/* Grid locks vertical rhythm: orb stays centered in flex row; controls slot has fixed height so Begin/Cancel swaps don't jump layout */}
      <div className="relative z-[3] grid min-h-0 w-full min-w-0 max-w-none flex-1 grid-rows-[auto_auto_auto_auto] md:grid-rows-[auto_auto_minmax(0,1fr)_minmax(296px,296px)] lg:grid-rows-[auto_auto_minmax(0,1fr)_minmax(304px,304px)] gap-y-5 md:gap-y-10 lg:gap-y-12 px-3 sm:px-4 md:max-w-[min(52rem,calc(100vw-18rem))] lg:max-w-[min(56rem,calc(100vw-22rem))] lg:px-10 xl:px-12 pb-8 md:pb-12 lg:pb-14">
        <div className="text-center shrink-0">
          <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Practice
          </p>
          <p className="mt-3 md:mt-4 text-base md:text-lg lg:text-xl text-ink-secondary leading-snug md:max-w-2xl lg:max-w-3xl mx-auto">
            {c.theme}
          </p>
        </div>

        <div className="relative z-[50] flex shrink-0 justify-center gap-3 flex-wrap pointer-events-auto">
          <button
            type="button"
            onClick={() => handleKindSwitch("timed")}
            className={cn(
              "relative px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-colors scroll-mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50",
              kind === "timed"
                ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                : "border-white/14 bg-white/[0.06] text-white/[0.82] hover:border-white/24 hover:bg-white/[0.09] hover:text-white",
            )}
          >
            Timed goal
          </button>
          <button
            type="button"
            onClick={() => handleKindSwitch("free")}
            className={cn(
              "relative px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-colors scroll-mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50",
              kind === "free"
                ? "border-accent-lavender bg-accent-lavender/15 text-ink-primary"
                : "border-white/14 bg-white/[0.06] text-white/[0.82] hover:border-white/24 hover:bg-white/[0.09] hover:text-white",
            )}
          >
            Open session
          </button>
        </div>

        <div className="relative z-[10] flex min-h-0 flex-col items-center justify-center gap-6 md:gap-10 lg:gap-12 overflow-visible py-4 md:py-10 lg:py-12 pointer-events-none [&>*]:pointer-events-auto">
          <ChakraPracticeOrb
            chakraId={c.id}
            accent={c.color}
            phase={phase}
            orbDigits={orbDigits}
            caption={orbCaption}
          />

          <p className="md:hidden text-center text-[11px] text-ink-secondary px-3 italic leading-relaxed">
            {c.mantra}
            <span className="not-italic text-ink-muted"> · {c.frequency_hz} Hz</span>
          </p>
        </div>

        <div className="relative z-[40] flex min-h-0 w-full flex-col items-center justify-center overflow-x-hidden overflow-y-visible px-1 py-2 pointer-events-auto">
          {phase === "idle" && kind === "timed" && (
            <div className="flex w-full max-w-lg flex-col items-center justify-center text-center">
              <p className="text-[11px] font-medium text-ink-muted mb-4 md:mb-5">
                Choose a length
              </p>
              <div className="flex justify-center gap-3 md:gap-3 flex-wrap">
                {PRESET_MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetSeconds(m * 60)}
                    className={cn(
                      "relative px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-colors scroll-mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lavender/50",
                      targetSeconds === m * 60
                        ? "border-accent-lavender bg-accent-lavender/10 text-ink-primary"
                        : "border-white/14 bg-white/[0.06] text-white/[0.82] hover:border-white/28 hover:bg-white/[0.09] hover:text-white",
                    )}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <Button
                onClick={() => {
                  resetSession();
                  setElapsed(0);
                  setPhase("running");
                }}
                className="mt-8 md:mt-9 px-10 py-3"
              >
                Begin
              </Button>
            </div>
          )}

          {phase === "idle" && kind === "free" && (
            <div className="flex w-full max-w-xl flex-col items-center justify-center text-center">
              <p className="text-xs md:text-sm lg:text-base text-ink-secondary leading-relaxed mb-6 md:mb-8 max-w-xl mx-auto">
                Timer counts up. Stop when you finish — the session saves automatically.
              </p>
              <Button
                onClick={() => {
                  resetSession();
                  setElapsed(0);
                  setPhase("running");
                }}
                className="px-10 py-3"
              >
                Start session
              </Button>
            </div>
          )}

          {phase === "running" && kind === "timed" && (
            <div className="flex justify-center gap-3 flex-wrap">
              <Button variant="outline" onClick={() => setPhase("paused")}>
                Pause
              </Button>
              <Button variant="ghost" onClick={abandon}>
                Cancel
              </Button>
            </div>
          )}

          {phase === "running" && kind === "free" && (
            <div className="flex flex-col items-center gap-3">
              <Button onClick={submitFreeSession} loading={save.isPending}>
                Save session
              </Button>
              <Button variant="ghost" onClick={abandon}>
                Discard
              </Button>
              {save.isError && (
                <p className="text-xs text-accent-rose max-w-sm text-center">
                  {extractMessage(save.error)}
                </p>
              )}
            </div>
          )}

          {phase === "paused" && (
            <div className="flex justify-center gap-3 flex-wrap">
              <Button onClick={() => setPhase("running")}>Resume</Button>
              <Button variant="ghost" onClick={abandon}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
