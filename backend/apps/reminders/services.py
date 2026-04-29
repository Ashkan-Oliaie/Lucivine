"""Reminder firing logic — invoked by /api/internal/fire-due-reminders/.

Due reminders fire when this endpoint runs while next_fire_at <= now(). Schedule it frequently
(e.g. every 15–60s). Stored times align to minute boundaries in the user's TZ; delivery skew is
mostly polling granularity plus push-gateway latency — not guaranteed second-perfect.

In production use Cloud Scheduler / cron with the shared-secret header.

Delivery is via Web Push (VAPID). Email is supported as a fallback channel
but disabled by default — `Reminder.channel` defaults to `PUSH`.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from typing import TypedDict

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import NotificationLog, PushSubscription, Reminder
from .vapid import private_key as vapid_private_key

log = logging.getLogger(__name__)


class FireResult(TypedDict):
    reminder_id: str
    delivered: bool
    error: str


def _cue(reminder: Reminder) -> tuple[str, str, str]:
    """Return (title, body, deeplink_path) for a reminder."""
    label = (reminder.label or "").strip()
    try:
        kind = Reminder.Kind(reminder.kind)
    except ValueError:
        log.warning("Unknown reminder.kind=%r — using generic cue", reminder.kind)
        return (
            label or "Oneiric Academy",
            label or "Reminder — tap to open Oneiric.",
            "/",
        )
    cues = {
        Reminder.Kind.RC: (
            "Reality check",
            "Pause. Pinch your nose, try to breathe through it.",
            "/reality",
        ),
        Reminder.Kind.MEDITATION: (
            "Meditation",
            "A few minutes of breath. Return to the body.",
            "/chakras",
        ),
        Reminder.Kind.JOURNAL: (
            "Dream journal",
            "What did you remember? Write before it dissolves.",
            "/journal/new",
        ),
        Reminder.Kind.WBTB: (
            "Wake back to bed",
            "Stay still. Hold the intention. Slip back gently.",
            "/",
        ),
        Reminder.Kind.CUSTOM: (
            label or "Reminder",
            (
                f"{label} — time for your practice."
                if label
                else "Your custom reminder — tap to open Oneiric."
            ),
            "/",
        ),
    }
    return cues[kind]


def _send_webpush(subscription: PushSubscription, payload: dict) -> tuple[bool, str]:
    """Send one push. Returns (delivered, error).

    410/404 from the push service means the subscription is dead — we delete it.
    """
    try:
        from pywebpush import WebPushException, webpush  # type: ignore[import-untyped]
    except ImportError as exc:
        return False, f"pywebpush not installed: {exc}"

    priv = vapid_private_key()
    if not priv:
        return False, "VAPID private key not configured"

    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=json.dumps(payload),
            vapid_private_key=priv,
            vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"},
            ttl=60 * 60 * 6,  # 6h — older than this, the cue is stale
            # Helps FCM/APNs-style intermediaries prioritize delivery when no tab is open (RFC 8030).
            headers={"Urgency": "high"},
        )
        return True, ""
    except WebPushException as exc:
        # 410 Gone / 404 Not Found = subscription is permanently dead
        resp = getattr(exc, "response", None)
        code = getattr(resp, "status_code", None)
        if code in (404, 410):
            log.info("Pruning dead subscription %s (status=%s)", subscription.id, code)
            subscription.delete()
        return False, f"{code or '?'}: {exc}"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def deliver_push(user, payload: dict) -> tuple[int, list[str]]:
    """Send a payload to all of `user`'s active push subscriptions.

    Returns (delivered_count, errors).
    """
    subs = list(PushSubscription.objects.filter(user=user))
    if not subs:
        return 0, ["no subscriptions"]
    delivered = 0
    errors: list[str] = []
    for sub in subs:
        ok, err = _send_webpush(sub, payload)
        if ok:
            delivered += 1
        elif err:
            errors.append(err)
    return delivered, errors


def fire_reminder(reminder: Reminder, *, force: bool = False) -> FireResult:
    """Send the reminder via the configured channel and record the attempt.

    Returns a serializable result. Always recomputes `next_fire_at` so a
    poisoned reminder doesn't get stuck firing on every tick.
    """
    if not reminder.enabled and not force:
        return {"reminder_id": str(reminder.id), "delivered": False, "error": "disabled"}

    title, body, path = _cue(reminder)
    delivered = False
    error = ""
    channel = reminder.channel

    try:
        if channel in (Reminder.Channel.PUSH, Reminder.Channel.BOTH):
            payload = {
                "title": title,
                "body": body,
                # Unique per *delivery*: stable tags caused the OS to replace prior alerts without
                # sounding again on repeating intervals / reopen scenarios.
                "tag": f"oa-{reminder.id}-{uuid.uuid4().hex[:16]}",
                "url": path,
                "reminder_id": str(reminder.id),
            }
            push_count, push_errs = deliver_push(reminder.user, payload)
            if push_count > 0:
                delivered = True
            elif push_errs:
                error = "; ".join(push_errs)

        if channel in (Reminder.Channel.EMAIL, Reminder.Channel.BOTH):
            send_mail(
                subject=title,
                message=body,
                from_email=None,
                recipient_list=[reminder.user.email],
                fail_silently=False,
            )
            delivered = True
    except Exception as exc:  # noqa: BLE001
        log.exception("Failed to deliver reminder %s", reminder.id)
        error = str(exc)

    NotificationLog.objects.create(
        reminder=reminder, channel=channel, delivered=delivered, error=error
    )

    now = timezone.now()
    reminder.last_fired_at = now
    reminder.next_fire_at = reminder.compute_next_fire(now=now)
    reminder.save(update_fields=["last_fired_at", "next_fire_at"])

    return {"reminder_id": str(reminder.id), "delivered": delivered, "error": error}


def fire_all_due(now: datetime | None = None) -> list[FireResult]:
    now = now or timezone.now()
    due = Reminder.objects.select_related("user").filter(
        enabled=True, next_fire_at__lte=now
    )
    return [fire_reminder(r) for r in due]


def fire_user_due(user, *, now: datetime | None = None) -> list[FireResult]:
    """Fire due reminders for one user.

    Used when the SPA polls while logged in—covers local dev without the Docker
    scheduler container and backs up missed Cloud Scheduler ticks while a tab is open.
    """
    now = now or timezone.now()
    due = Reminder.objects.select_related("user").filter(
        user=user, enabled=True, next_fire_at__lte=now
    )
    return [fire_reminder(r) for r in due]


def send_test_push(user) -> dict:
    """Send a one-off test push to all the user's subscriptions."""
    delivered, errors = deliver_push(
        user,
        {
            "title": "Oneiric Academy",
            "body": "Notifications are on. The dream remembers itself.",
            "tag": f"test-{uuid.uuid4().hex[:16]}",
            "url": "/",
        },
    )
    return {"delivered": delivered, "errors": errors}
