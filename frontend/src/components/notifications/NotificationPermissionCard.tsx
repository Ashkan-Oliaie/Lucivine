import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ensureServiceWorker,
  getPermissionState,
  isPushSupported,
  primePushNotificationSound,
  subscribeAndRegister,
  unsubscribe,
  type PushPermissionState,
} from "@/lib/push";
import {
  fetchVapidPublicKey,
  listMySubscriptions,
  sendTestPush,
} from "@/api/push";
import { extractMessage } from "@/api/client";

type Status = {
  permission: PushPermissionState;
  browserSubscribed: boolean;
  serverDeviceCount: number;
  swActive: boolean;
  vapidConfigured: boolean;
};

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as unknown as { MSStream?: unknown }).MSStream;

export function NotificationPermissionCard() {
  const [status, setStatus] = useState<Status>({
    permission: "default",
    browserSubscribed: false,
    serverDeviceCount: 0,
    swActive: false,
    vapidConfigured: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmTurnOffOpen, setConfirmTurnOffOpen] = useState(false);

  async function refresh() {
    if (!isPushSupported()) {
      setStatus((s) => ({ ...s, permission: "unsupported" }));
      return;
    }
    const permission = getPermissionState();
    let swActive = false;
    let browserSubscribed = false;
    try {
      const reg = await ensureServiceWorker();
      swActive = !!reg.active;
      const sub = await reg.pushManager.getSubscription();
      browserSubscribed = !!sub;
    } catch {
      /* no SW — handled below */
    }
    let vapidConfigured = false;
    try {
      const key = await fetchVapidPublicKey();
      vapidConfigured = Boolean(key);
    } catch {
      /* server might be down — treat as unconfigured */
    }
    let serverDeviceCount = 0;
    if (permission === "granted") {
      try {
        const subs = await listMySubscriptions();
        serverDeviceCount = subs.count;
      } catch {
        /* user might not be authed yet */
      }
    }
    setStatus({
      permission,
      browserSubscribed,
      serverDeviceCount,
      swActive,
      vapidConfigured,
    });
  }

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Self-heal: if the browser thinks it's subscribed but the server has zero
  // devices for this user, re-POST the subscription. This handles DB resets,
  // account switches, and stale browser-side subs.
  useEffect(() => {
    if (
      status.permission === "granted" &&
      status.browserSubscribed &&
      status.serverDeviceCount === 0 &&
      status.vapidConfigured
    ) {
      (async () => {
        try {
          await subscribeAndRegister();
          await refresh();
        } catch {
          /* user can hit "Re-subscribe" manually */
        }
      })();
    }
  }, [
    status.permission,
    status.browserSubscribed,
    status.serverDeviceCount,
    status.vapidConfigured,
  ]);

  async function onEnable() {
    primePushNotificationSound();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await subscribeAndRegister();
      setInfo("Notifications are on for this device.");
      await refresh();
    } catch (err) {
      setError(extractMessage(err, (err as Error)?.message ?? "Couldn't enable notifications."));
    } finally {
      setBusy(false);
    }
  }

  async function onResubscribe() {
    primePushNotificationSound();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      // Force a clean sub by unsubscribing first, then re-registering.
      await unsubscribe().catch(() => undefined);
      await subscribeAndRegister();
      setInfo("Subscription refreshed.");
      await refresh();
    } catch (err) {
      setError(extractMessage(err, (err as Error)?.message ?? "Couldn't refresh."));
    } finally {
      setBusy(false);
    }
  }

  async function disableNotifications(): Promise<boolean> {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await unsubscribe();
      setInfo("Notifications turned off on this device.");
      await refresh();
      return true;
    } catch (err) {
      setError(extractMessage(err, (err as Error)?.message ?? "Couldn't turn off."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    primePushNotificationSound();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      let res = await sendTestPush();
      // If the server has no row, try one auto-recovery before giving up.
      if (res.delivered === 0 && res.errors.some((e) => /no subscriptions/i.test(e))) {
        try {
          await subscribeAndRegister();
          await refresh();
          res = await sendTestPush();
        } catch {
          /* fall through to error message */
        }
      }
      if (res.delivered > 0) {
        setInfo(`Test sent to ${res.delivered} device${res.delivered > 1 ? "s" : ""}.`);
      } else {
        setError(
          res.errors.length
            ? `Couldn't deliver: ${res.errors.join("; ")}`
            : "No active subscriptions on this account yet — try Re-subscribe.",
        );
      }
    } catch (err) {
      setError(extractMessage(err, (err as Error)?.message ?? "Couldn't send test."));
    } finally {
      setBusy(false);
    }
  }

  // ---- Render ----

  if (status.permission === "unsupported") {
    return (
      <Wrap tone="rose">
        <p className="ritual-eyebrow text-accent-rose mb-2">Notifications unavailable</p>
        <p className=" text-lg text-ink-primary">
          This browser doesn't support web push.
        </p>
        {isIOS() && !isStandalone() && (
          <p className=" text-sm text-ink-secondary mt-2 leading-relaxed">
            On iPhone/iPad, web push only works after you install Lucivine to your
            Home Screen. In Safari, tap Share → <em>Add to Home Screen</em>, then
            open the app from there.
          </p>
        )}
      </Wrap>
    );
  }

  if (!status.vapidConfigured && status.permission !== "denied") {
    return (
      <Wrap tone="amber">
        <p className="ritual-eyebrow text-accent-amber mb-2">Push not configured</p>
        <p className=" text-lg text-ink-primary">
          Can't load push configuration from the server.
        </p>
        <p className=" text-sm text-ink-secondary mt-2 leading-relaxed">
          Check that the API is running and reachable. Push keys are generated automatically on the
          backend — you don't need to create them manually.
        </p>
      </Wrap>
    );
  }

  if (status.permission === "denied") {
    return (
      <Wrap tone="rose">
        <p className="ritual-eyebrow text-accent-rose mb-2">Notifications blocked</p>
        <p className=" text-lg text-ink-primary">
          You'll need to allow notifications in your browser settings.
        </p>
        <p className=" text-sm text-ink-secondary mt-2 leading-relaxed">
          Click the lock/shield next to the address bar, find{" "}
          <em>Notifications</em>, switch to <em>Allow</em>, then refresh.
        </p>
      </Wrap>
    );
  }

  if (
    status.permission === "granted" &&
    status.browserSubscribed &&
    status.serverDeviceCount > 0
  ) {
    return (
      <Wrap tone="mint">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-accent-mint/15 text-accent-mint flex items-center justify-center text-lg shrink-0">
              ✓
            </span>
            <div>
              <p className="ritual-eyebrow mb-1">Notifications</p>
              <p className=" text-lg text-ink-primary">
                On — {status.serverDeviceCount} device
                {status.serverDeviceCount > 1 ? "s" : ""} registered
              </p>
              <p className=" text-sm text-ink-secondary mt-1">
                Reminders will arrive even with the tab closed. Your repeating schedules live in{" "}
                <strong className="text-ink-primary font-medium">Your scheduled reminders</strong>{" "}
                below — pause or delete anytime.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <Button variant="outline" size="sm" onClick={onTest} loading={busy}>
              Send test
            </Button>
            <Button variant="ghost" size="sm" onClick={onResubscribe} disabled={busy}>
              Re-subscribe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmTurnOffOpen(true)}
              disabled={busy}
            >
              Turn off
            </Button>
          </div>
        </div>
        {info && <p className="font-mono text-[11px] text-accent-mint mt-3">{info}</p>}
        {error && <p className="font-mono text-[11px] text-accent-rose mt-3">{error}</p>}
        <ConfirmDialog
          open={confirmTurnOffOpen}
          title="Turn off notifications?"
          description="Reminders won't be pushed to this browser until you enable them again. You can turn them back on anytime from this page."
          confirmLabel="Turn off"
          cancelLabel="Keep on"
          loading={busy}
          onClose={() => !busy && setConfirmTurnOffOpen(false)}
          onConfirm={() =>
            void disableNotifications().then((ok) => {
              if (ok) setConfirmTurnOffOpen(false);
            })
          }
        />
      </Wrap>
    );
  }

  // permission granted but mismatch (browser-only or server-only) → show repair UI
  if (status.permission === "granted" && status.browserSubscribed && status.serverDeviceCount === 0) {
    return (
      <Wrap tone="amber">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-accent-amber/15 text-accent-amber flex items-center justify-center text-lg shrink-0">
              ↻
            </span>
            <div>
              <p className="ritual-eyebrow mb-1">Out of sync</p>
              <p className=" text-lg text-ink-primary">
                This browser has a subscription but the server doesn't know it.
              </p>
              <p className=" text-sm text-ink-secondary mt-1">
                Tap re-subscribe — this happens after a DB reset or account switch.
              </p>
            </div>
          </div>
          <Button onClick={onResubscribe} loading={busy} className="shrink-0">
            Re-subscribe
          </Button>
        </div>
        {error && <p className="font-mono text-[11px] text-accent-rose mt-3">{error}</p>}
      </Wrap>
    );
  }

  // default | granted-but-unsubscribed
  return (
    <Wrap tone="amethyst">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent-amethyst/30 blur-3xl pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="w-10 h-10 rounded-full bg-accent-amethyst/20 text-accent-lavender flex items-center justify-center text-lg shrink-0">
            ◐
          </span>
          <div className="min-w-0">
            <p className="ritual-eyebrow mb-1">Enable notifications</p>
            <p className=" text-lg md:text-xl text-ink-primary">
              Let reminders pull you back to awareness.
            </p>
            <p className=" text-sm text-ink-secondary mt-1.5 leading-relaxed">
              Web push works on this device — even when the tab is closed.
              {isIOS() && !isStandalone() && (
                <>
                  {" "}On iPhone, install to the Home Screen first
                  (Share → Add to Home Screen).
                </>
              )}
            </p>
            {!status.swActive && (
              <p className="font-mono text-[10px] text-ink-muted mt-2">
                Service worker still installing…
              </p>
            )}
          </div>
        </div>
        <Button onClick={onEnable} loading={busy} className="shrink-0">
          Allow notifications
        </Button>
      </div>
      {error && <p className="font-mono text-[11px] text-accent-rose mt-3 relative">{error}</p>}
      {info && <p className="font-mono text-[11px] text-accent-mint mt-3 relative">{info}</p>}
    </Wrap>
  );
}

function Wrap({
  tone,
  children,
}: {
  tone: "mint" | "amethyst" | "amber" | "rose";
  children: React.ReactNode;
}) {
  const border = {
    mint: "border-accent-mint/30",
    amethyst: "border-accent-amethyst/30",
    amber: "border-accent-amber/30",
    rose: "border-accent-rose/30",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden glass rounded-2xl p-5 md:p-6 ${border}`}
    >
      {children}
    </motion.div>
  );
}
