/* Lucivine — service worker for Web Push.
 *
 * Two responsibilities:
 *   1. `push` event   → display the notification.
 *   2. `notificationclick` event → focus an existing tab or open a new one
 *      at the deeplink path the server included in the payload.
 *
 * The SW must be served at the site root (scope "/") so it can control
 * the whole app. We don't precache app assets here — that's Vite's job.
 *
 * Push + `showNotification`: many mobile browsers reject SVG icons; if that
 * throws, we retry without icons so the notification still appears with the tab closed.
 *
 * IMPORTANT: Always show via showNotification — do not skip based on “focused” tabs with
 * postMessage-only delivery; if the document hasn’t mounted yet, messages are lost and
 * pushes appear “broken” after reopening the site.
 *
 * Custom chime: when at least one window exists, we postMessage so the page plays
 * /notification.mp3 (SW cannot reliably play audio). We keep silent:false so if in-page
 * play() is blocked by autoplay policy, the OS notification sound still fires.
 */

/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function resolveOpenUrl(path) {
  try {
    const p = typeof path === "string" && path.trim() ? path.trim() : "/";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return new URL(p, self.location.origin).href;
  } catch (_e) {
    return self.location.origin + "/";
  }
}

const NOTIFICATION_SOUND_SRC = "/notification.mp3";

async function showSystemNotification(title, base) {
  try {
    await self.registration.showNotification(title, {
      ...base,
      icon: "/icon.svg",
      badge: "/icon.svg",
    });
  } catch (_e1) {
    try {
      await self.registration.showNotification(title, {
        ...base,
        icon: "/icon.svg",
      });
    } catch (_e2) {
      await self.registration.showNotification(title, base);
    }
  }
}

/** Prefer one visible tab so we don't play the clip from multiple windows at once. */
async function notifyPageToPlaySound() {
  try {
    const wins = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    const visible = wins.find(
      (c) => "visibilityState" in c && /** @type {WindowClient} */ (c).visibilityState === "visible",
    );
    const target = visible ?? wins[0];
    if (!target) return false;
    target.postMessage({
      type: "PLAY_NOTIFICATION_SOUND",
      src: NOTIFICATION_SOUND_SRC,
    });
    return true;
  } catch (_e) {
    return false;
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event.data ? event.data.json() : {};
      } catch (_e) {
        payload = {
          title: "Lucivine",
          body: event.data ? event.data.text() : "",
        };
      }

      const title = payload.title || "Lucivine";
      const urlForClick = resolveOpenUrl(payload.url || "/");

      const base = {
        body: payload.body || "",
        silent: false,
        tag: payload.tag || undefined,
        renotify: Boolean(payload.tag),
        data: {
          url: urlForClick,
          reminder_id: payload.reminder_id,
        },
        vibrate: [80, 40, 80],
      };

      await notifyPageToPlaySound();
      await showSystemNotification(title, base);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/";
  const url = resolveOpenUrl(raw);

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin) {
            await client.focus();
            if ("navigate" in client) {
              try {
                await client.navigate(url);
              } catch (_e) {
                // ignore — focusing is good enough
              }
            }
            return;
          }
        } catch (_e) {
          // skip malformed URLs
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        client.postMessage({ type: "pushsubscriptionchange" });
      }
    })(),
  );
});
