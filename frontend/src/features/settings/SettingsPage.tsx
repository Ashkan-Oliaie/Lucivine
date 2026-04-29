import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateMe } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractMessage } from "@/api/client";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [tz, setTz] = useState(user?.timezone ?? "UTC");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => updateMe({ display_name: displayName, timezone: tz }),
    onSuccess: (u) => {
      setUser(u);
      qc.invalidateQueries();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    },
    onError: (err) => setError(extractMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    save.mutate();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-3">
        Settings
      </p>
      <h1 className=" text-4xl md:text-5xl font-light text-ink-primary">
        Tune your <em className="text-accent-lavender">vessel</em>.
      </h1>

      <Card className="mt-10">
        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Timezone"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            placeholder="e.g. Australia/Sydney"
          />
          <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-muted">
            Email: {user?.email}
          </p>
          {error && <p className="font-mono text-[10px] text-accent-rose">{error}</p>}
          <div className="flex justify-end items-center gap-3">
            {saved && (
              <span className="font-mono uppercase tracking-ritual text-[10px] text-accent-amber">
                saved
              </span>
            )}
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
