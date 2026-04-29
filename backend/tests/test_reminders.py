from datetime import time

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.reminders.models import NotificationLog, Reminder
from apps.reminders.services import _cue


@pytest.fixture
def daily_reminder(user, db):
    # Default channel is now `push`, but most existing tests exercise the email
    # path (no PushSubscription fixture) — opt back into email here so they
    # keep verifying the firing pipeline end-to-end.
    r = Reminder.objects.create(
        user=user,
        kind="meditation",
        cadence="daily",
        channel="email",
        time_of_day=time(7, 0),
        next_fire_at=timezone.now(),  # placeholder; computed on save in real flow
    )
    r.next_fire_at = r.compute_next_fire()
    r.save()
    return r


def test_custom_reminder_cue(auth_api, user, db):
    resp = auth_api.post(
        reverse("reminder-list"),
        {
            "kind": "custom",
            "label": "  Stretch  ",
            "cadence": "daily",
            "time_of_day": "20:00:00",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    rid = resp.json()["id"]
    reminder = Reminder.objects.get(pk=rid)
    title, body, path = _cue(reminder)
    assert title == "Stretch"
    assert "Stretch" in body
    assert path == "/"


def test_create_daily_reminder(auth_api, user):
    resp = auth_api.post(
        reverse("reminder-list"),
        {"kind": "meditation", "cadence": "daily", "time_of_day": "07:00:00"},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["kind"] == "meditation"
    assert body["next_fire_at"] is not None
    assert Reminder.objects.filter(user=user).count() == 1


def test_create_interval_reminder_requires_window(auth_api):
    resp = auth_api.post(
        reverse("reminder-list"),
        {
            "kind": "rc",
            "cadence": "interval",
            "time_of_day": "08:00:00",
            # missing interval_minutes + active_until
        },
        format="json",
    )
    assert resp.status_code == 400


def test_interval_minutes_must_be_between_1_and_1440(auth_api):
    resp = auth_api.post(
        reverse("reminder-list"),
        {
            "kind": "rc",
            "cadence": "interval",
            "time_of_day": "08:00:00",
            "active_until": "18:00:00",
            "interval_minutes": 2000,
        },
        format="json",
    )
    assert resp.status_code == 400


def test_user_only_sees_own_reminders(auth_api, user, db, daily_reminder):
    from django.contrib.auth import get_user_model

    other = get_user_model().objects.create_user(email="o@x.com", password="another-strong-pw-1")
    Reminder.objects.create(
        user=other,
        kind="rc",
        cadence="daily",
        time_of_day=time(8, 0),
        next_fire_at=timezone.now(),
    )

    resp = auth_api.get(reverse("reminder-list"))
    assert resp.status_code == 200
    assert resp.json()["count"] == 1


def test_test_action_fires_immediately(auth_api, daily_reminder, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from django.core import mail

    resp = auth_api.post(reverse("reminder-test", kwargs={"pk": daily_reminder.id}))
    assert resp.status_code == 200
    body = resp.json()
    assert body["delivered"] is True
    assert len(mail.outbox) == 1
    assert NotificationLog.objects.filter(reminder=daily_reminder).count() == 1


def test_internal_endpoint_requires_secret(api):
    resp = api.post(reverse("fire-due-reminders"))
    assert resp.status_code == 403


def test_internal_endpoint_fires_due(api, daily_reminder, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    # Force the reminder to be due
    daily_reminder.next_fire_at = timezone.now()
    daily_reminder.save(update_fields=["next_fire_at"])

    resp = api.post(
        reverse("fire-due-reminders"),
        HTTP_X_INTERNAL_SECRET=settings.INTERNAL_SCHEDULER_SECRET,
    )
    assert resp.status_code == 200
    assert resp.json()["fired"] == 1

    daily_reminder.refresh_from_db()
    assert daily_reminder.last_fired_at is not None
    # next_fire_at should have rolled forward
    assert daily_reminder.next_fire_at > timezone.now()


def test_flush_due_delivers_own_overdue(auth_api, daily_reminder, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from django.core import mail

    daily_reminder.next_fire_at = timezone.now()
    daily_reminder.save(update_fields=["next_fire_at"])

    resp = auth_api.post(reverse("reminder-flush-due"))
    assert resp.status_code == 200
    assert resp.json()["fired"] == 1
    assert len(mail.outbox) == 1

    daily_reminder.refresh_from_db()
    assert daily_reminder.next_fire_at > timezone.now()


def test_disabled_reminders_are_skipped(api, daily_reminder, settings):
    daily_reminder.enabled = False
    daily_reminder.next_fire_at = timezone.now()
    daily_reminder.save()

    resp = api.post(
        reverse("fire-due-reminders"),
        HTTP_X_INTERNAL_SECRET=settings.INTERNAL_SCHEDULER_SECRET,
    )
    assert resp.status_code == 200
    assert resp.json()["fired"] == 0


def test_vapid_public_key_is_served_without_manual_env(api):
    """Backend serves a non-empty key (env or auto-generated via apps.reminders.vapid)."""
    resp = api.get(reverse("vapid-public-key"))
    assert resp.status_code == 200
    key = resp.json()["public_key"]
    assert isinstance(key, str) and len(key) >= 40
