/* Web Push lifecycle helpers.
 *
 * The flow:
 *   1. Register the service worker at /sw.js (scope: /).
 *   2. Ask the user for Notification permission.
 *   3. Use the SW's PushManager to subscribe with the server's VAPID public key.
 *   4. Send the subscription (endpoint + keys) to the backend.
 *
 * The backend stores it and uses pywebpush to deliver reminders. The SW shows
 * the notification when a push arrives.
 */

import {
  fetchVapidPublicKey,
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/api/push";

/** Public asset played when a push arrives while an app tab exists (SW posts PLAY_NOTIFICATION_SOUND). */
export const PUSH_NOTIFICATION_SOUND_SRC = "/notification.mp3";

let notificationAudio: HTMLAudioElement | null = null;

/** Helps Chrome/Safari treat subsequent Audio playback as allowed after any recent gesture. */
let notificationAudioCtx: AudioContext | null = null;

function resumeAudioContextFromGesture(): void {
  try {
    const AC =
      typeof globalThis !== "undefined" && "AudioContext" in globalThis
        ? globalThis.AudioContext
        : typeof globalThis !== "undefined" &&
            "webkitAudioContext" in globalThis &&
            typeof (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext ===
              "function"
          ? (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          : undefined;
    if (!AC) return;
    notificationAudioCtx ??= new AC();
    void notificationAudioCtx.resume().catch(() => {});
  } catch {
    /* ignore */
  }
}

function getNotificationAudio(src: string): HTMLAudioElement {
  if (!notificationAudio) {
    notificationAudio = new Audio(src);
    notificationAudio.preload = "auto";
  }
  return notificationAudio;
}

/**
 * Call synchronously from a click/tap handler (before await) so the browser ties
 * playback capability to user activation; otherwise SW-triggered play() is
 * usually blocked as autoplay with no sound at all.
 */
export function primePushNotificationSound(src: string = PUSH_NOTIFICATION_SOUND_SRC): void {
  try {
    resumeAudioContextFromGesture();
    const audio = getNotificationAudio(src);
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.72;
      })
      .catch(() => {
        audio.volume = 0.72;
      });
  } catch {
    /* ignore */
  }
}

/** Play reminder chime from document context (SW cannot reliably decode/play MP3). */
export function playPushNotificationSound(src: string = PUSH_NOTIFICATION_SOUND_SRC): void {
  const tryPlay = (el: HTMLAudioElement): Promise<void> => {
    el.volume = 0.72;
    el.currentTime = 0;
    return el.play();
  };

  try {
    const audio = getNotificationAudio(src);
    void tryPlay(audio).catch(() => {
      try {
        const oneShot = new Audio(src);
        oneShot.volume = 0.72;
        void oneShot.play().catch(() => {});
      } catch {
        /* ignore */
      }
    });
  } catch {
    try {
      const oneShot = new Audio(src);
      oneShot.volume = 0.72;
      void oneShot.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }
}

export type PushPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermissionState(): PushPermissionState {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushPermissionState;
}

/** Convert URL-safe base64 (VAPID public key from server) to Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

export function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushSupported()) {
    return Promise.reject(new Error("Push not supported in this browser."));
  }
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }
  return registrationPromise;
}

/** Returns the current PushSubscription on this device, if any. */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await ensureServiceWorker();
  return reg.pushManager.getSubscription();
}

export async function requestPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  return result as PushPermissionState;
}

/** Compare a browser subscription's applicationServerKey against the server's
 * current VAPID public key. If they differ, the existing subscription is
 * keyed against an old VAPID and must be replaced — push delivery would
 * silently fail otherwise. */
function subscriptionMatchesKey(
  sub: PushSubscription,
  publicKey: string,
): boolean {
  const opts = sub.options;
  const key = opts?.applicationServerKey;
  if (!key) return false;
  const expected = urlBase64ToUint8Array(publicKey);
  const got = new Uint8Array(key as ArrayBuffer);
  if (expected.length !== got.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== got[i]) return false;
  }
  return true;
}

/** Subscribe (or re-use existing) and register with the backend.
 *
 * Self-heals three failure modes:
 *   - browser already has a sub but backend lost the row → re-POSTs
 *   - browser has a sub keyed against an old VAPID → unsubscribe + re-subscribe
 *   - permission was granted but no sub exists → subscribe fresh
 */
export async function subscribeAndRegister(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Push not supported in this browser.");
  }
  if (Notification.permission !== "granted") {
    const result = await requestPermission();
    if (result !== "granted") {
      throw new Error(
        result === "denied"
          ? "Notifications were blocked. Enable them in your browser settings."
          : "Notification permission was not granted.",
      );
    }
  }

  const reg = await ensureServiceWorker();
  // Wait until the SW is actually active — subscribing on an installing SW
  // can fail with a "no active service worker" error on some browsers.
  if (!reg.active) {
    await new Promise<void>((resolve) => {
      const sw = reg.installing ?? reg.waiting;
      if (!sw) {
        resolve();
        return;
      }
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") resolve();
      });
    });
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    throw new Error(
      "VAPID public key missing — ensure the API is reachable; keys are generated server-side.",
    );
  }

  let subscription = await reg.pushManager.getSubscription();

  // If the existing sub was keyed against a different VAPID, replace it.
  if (subscription && !subscriptionMatchesKey(subscription, publicKey)) {
    try {
      await subscription.unsubscribe();
    } catch {
      /* ignore */
    }
    subscription = null;
  }

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast — TS DOM lib types BufferSource as ArrayBuffer-only, but Uint8Array
      // is the documented input shape for applicationServerKey.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint) {
    throw new Error("Subscription has no endpoint — browser push misconfigured.");
  }

  // Always POST — backend upserts by endpoint. This self-heals any case where
  // the backend lost the row (DB reset, account switch, etc).
  await registerPushSubscription(
    {
      endpoint: json.endpoint,
      keys: json.keys,
    },
    navigator.userAgent.slice(0, 250),
  );

  return subscription;
}

/** Unsubscribe locally and tell the backend to drop the row. */
export async function unsubscribe(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await ensureServiceWorker();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  try {
    await unregisterPushSubscription(endpoint);
  } catch {
    // Server may already have pruned it; ignore.
  }
}

/** Debounced push resync after returning to the tab — fixes stale SW/subscription after reopen. */
const RESYNC_DEBOUNCE_MS = 45_000;
let lastPushResyncAt = 0;

function schedulePushResyncFromVisibility(): void {
  if (!isPushSupported()) return;
  const now = Date.now();
  if (now - lastPushResyncAt < RESYNC_DEBOUNCE_MS) return;
  lastPushResyncAt = now;

  void (async () => {
    try {
      const reg = await ensureServiceWorker();
      await reg.update();
      if (Notification.permission !== "granted") return;
      await subscribeAndRegister();
    } catch {
      /* offline or logged out — ignore */
    }
  })();
}

/** Best-effort: register SW on app boot, no permission request. */
export function registerServiceWorkerEagerly(): void {
  if (!isPushSupported()) return;
  ensureServiceWorker().catch((err) => {
    // eslint-disable-next-line no-console
    console.warn("Service worker registration failed:", err);
  });

  /** Re-prime after gestures so autoplay stays “warm” (not only the first tap). */
  const PRIME_GAP_MS = 20_000;
  let lastPrimeAt = 0;
  function primeDebounced(): void {
    const now = Date.now();
    if (now - lastPrimeAt < PRIME_GAP_MS) return;
    lastPrimeAt = now;
    primePushNotificationSound();
  }

  for (const evt of ["pointerdown", "keydown", "touchstart"] as const) {
    document.addEventListener(evt, primeDebounced, { capture: true, passive: true });
  }
  window.addEventListener("focus", primeDebounced, { passive: true });

  function onVisibilityOrRestore() {
    if (document.visibilityState !== "visible") return;
    primeDebounced();
    schedulePushResyncFromVisibility();
  }

  document.addEventListener("visibilitychange", onVisibilityOrRestore);
  window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) onVisibilityOrRestore();
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "pushsubscriptionchange") {
      subscribeAndRegister().catch(() => {
        /* user can re-enable from the UI */
      });
      return;
    }

    if (data.type === "PLAY_NOTIFICATION_SOUND") {
      const src =
        typeof data.src === "string" && data.src.length > 0 ? data.src : PUSH_NOTIFICATION_SOUND_SRC;
      playPushNotificationSound(src);
    }
  });
}
