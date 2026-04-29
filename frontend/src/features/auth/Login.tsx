import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { login } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractMessage } from "@/api/client";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await login({ email, password });
      setSession({ access: data.access, refresh: data.refresh }, data.user);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractMessage(err, "Could not sign in."));
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
        Return
      </p>
      <h1 className=" text-4xl md:text-5xl font-light text-ink-primary text-center mb-12">
        Step back through.
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
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="font-mono text-[10px] text-accent-rose">{error}</p>
          )}
          <Button type="submit" loading={submitting} className="w-full">
            Cross
          </Button>
        </form>
      </Card>
      <p className="text-center mt-6 font-mono text-[10px] uppercase tracking-ritual text-ink-muted">
        New here?{" "}
        <Link to="/register" className="text-ink-secondary hover:text-ink-primary">
          Begin
        </Link>
      </p>
    </motion.div>
  );
}
