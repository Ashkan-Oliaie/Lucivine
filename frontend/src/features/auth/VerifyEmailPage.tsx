import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { verifyEmail } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractMessage } from "@/api/client";
import { cn } from "@/lib/cn";

const LENGTH = 6;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (user?.email_verified) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleChange(i: number, raw: string) {
    const v = raw.replace(/\D/g, "").slice(-1);
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  async function submit(code?: string) {
    const finalCode = code ?? digits.join("");
    if (finalCode.length !== LENGTH) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await verifyEmail(finalCode);
      setUser(updated);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractMessage(err, "Could not verify."));
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-submit when all six digits are entered
  useEffect(() => {
    const code = digits.join("");
    if (code.length === LENGTH && !submitting) submit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary text-center mb-4">
        Verification
      </p>
      <h1 className=" text-3xl md:text-4xl font-light text-ink-primary text-center mb-6">
        Confirm the gate.
      </h1>
      <p className=" italic text-ink-secondary text-center mb-12 px-6">
        We sent a six-digit code to{" "}
        <span className="text-ink-primary not-italic">{user?.email}</span>.
      </p>

      <Card>
        <div
          className="flex justify-center gap-2 md:gap-3"
          onPaste={handlePaste as unknown as React.ClipboardEventHandler<HTMLDivElement>}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                "w-11 h-14 md:w-12 md:h-16 text-center text-2xl md:text-3xl",
                "bg-white/[0.03] border rounded-md text-ink-primary",
                "focus:outline-none focus:border-accent-lavender/60 transition-colors",
                error ? "border-accent-rose/60" : "border-white/10",
              )}
            />
          ))}
        </div>

        {error && (
          <p className="mt-6 font-mono text-[10px] text-accent-rose text-center">
            {error}
          </p>
        )}

        <Button
          onClick={() => submit()}
          loading={submitting}
          className="mt-8 w-full"
          disabled={digits.join("").length !== LENGTH}
        >
          Cross
        </Button>
      </Card>

      <p className="text-center mt-6 font-mono text-[10px] uppercase tracking-ritual text-ink-muted">
        Skip for now ·{" "}
        <button
          onClick={() => navigate("/")}
          className="text-ink-secondary hover:text-ink-primary"
        >
          Continue without verifying
        </button>
      </p>
    </motion.div>
  );
}
