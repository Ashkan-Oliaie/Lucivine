import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { register } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractMessage } from "@/api/client";

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await register({
        email,
        password,
        display_name: displayName || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setSession({ access: data.access, refresh: data.refresh }, data.user);
      navigate("/verify-email", { replace: true });
    } catch (err) {
      setError(extractMessage(err, "Could not create account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary text-center mb-4">
        Initiation
      </p>
      <h1 className=" text-4xl md:text-5xl font-light text-ink-primary text-center mb-12">
        Cross the threshold.
      </h1>
      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Name"
            placeholder="What shall we call you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="font-mono text-[10px] text-accent-rose">{error}</p>
          )}
          <Button type="submit" loading={submitting} className="w-full">
            Begin
          </Button>
        </form>
      </Card>
      <p className="text-center mt-6 font-mono text-[10px] uppercase tracking-ritual text-ink-muted">
        Already a practitioner?{" "}
        <Link to="/login" className="text-ink-secondary hover:text-ink-primary">
          Return
        </Link>
      </p>
    </motion.div>
  );
}
