from datetime import date, timedelta

from django.urls import reverse
from django.utils import timezone

from apps.analytics.services import compute_streak
from apps.journal.models import DreamEntry
from apps.meditation.models import ChakraSession
from apps.reality_checks.models import RealityCheck


def test_streak_with_no_practice(user, db):
    assert compute_streak(user) == 0


def test_streak_three_consecutive_days(user, db):
    today = timezone.localdate()
    DreamEntry.objects.create(user=user, title="a", dream_date=today)
    DreamEntry.objects.create(user=user, title="b", dream_date=today - timedelta(days=1))
    RealityCheck.objects.create(user=user, method="hand")  # today
    ChakraSession.objects.create(
        user=user, chakra_id="heart", duration_seconds=60
    )  # today (auto)
    DreamEntry.objects.create(user=user, title="c", dream_date=today - timedelta(days=2))

    assert compute_streak(user) == 3


def test_streak_breaks_on_gap(user, db):
    today = timezone.localdate()
    DreamEntry.objects.create(user=user, title="a", dream_date=today)
    DreamEntry.objects.create(user=user, title="b", dream_date=today - timedelta(days=2))
    # gap on day-1
    assert compute_streak(user) == 1


def test_streak_today_optional(user, db):
    today = timezone.localdate()
    # only yesterday — today is empty but streak should still be 1
    DreamEntry.objects.create(user=user, title="a", dream_date=today - timedelta(days=1))
    assert compute_streak(user) == 1


def test_dashboard_endpoint_shape(auth_api, user):
    DreamEntry.objects.create(
        user=user,
        title="lucid one",
        dream_date=timezone.localdate(),
        is_lucid=True,
        technique_used="WILD",
    )
    RealityCheck.objects.create(user=user, method="hand")

    resp = auth_api.get(reverse("analytics-dashboard"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["streak"] >= 1
    assert body["totals"]["lucid_dreams"] == 1
    assert body["totals"]["wild_successes"] == 1
    assert body["totals"]["reality_checks"] == 1
    assert len(body["recent_lucids"]) == 1


def test_heatmap_returns_year(auth_api, user):
    today = timezone.localdate()
    DreamEntry.objects.create(user=user, title="x", dream_date=today, is_lucid=True)

    resp = auth_api.get(reverse("analytics-heatmap") + f"?year={today.year}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["year"] == today.year
    found = next((d for d in body["days"] if d["date"] == str(today)), None)
    assert found is not None
    assert found["dream_entries"] == 1
    assert found["lucid_dreams"] == 1


def test_timeline_metric_validation(auth_api):
    resp = auth_api.get(reverse("analytics-timeline") + "?metric=bogus")
    assert resp.status_code == 400


def test_timeline_lucid_count(auth_api, user):
    today = timezone.localdate()
    DreamEntry.objects.create(user=user, title="a", dream_date=today, is_lucid=True)
    DreamEntry.objects.create(
        user=user, title="b", dream_date=today - timedelta(days=2), is_lucid=True
    )

    resp = auth_api.get(reverse("analytics-timeline") + "?metric=lucid_count&range=7d")
    assert resp.status_code == 200
    body = resp.json()
    assert body["metric"] == "lucid_count"
    assert body["range_days"] == 7
    assert len(body["points"]) == 7  # filled with zeros
    total = sum(p["value"] for p in body["points"])
    assert total == 2


def test_timeline_chakra_minutes(auth_api, user):
    ChakraSession.objects.create(user=user, chakra_id="heart", duration_seconds=600)
    ChakraSession.objects.create(user=user, chakra_id="thirdeye", duration_seconds=900)

    resp = auth_api.get(reverse("analytics-timeline") + "?metric=chakra_minutes&range=30d")
    assert resp.status_code == 200
    total = sum(p["value"] for p in resp.json()["points"])
    assert total == 25  # (600 + 900) // 60


def test_timeline_requires_auth(api):
    resp = api.get(reverse("analytics-timeline") + "?metric=lucid_count")
    assert resp.status_code == 401


def test_heatmap_invalid_year(auth_api):
    resp = auth_api.get(reverse("analytics-heatmap") + "?year=notayear")
    assert resp.status_code == 400


def test_dashboard_default_year_uses_current(auth_api):
    """Sanity: heatmap with no year param uses current year and returns 200."""
    resp = auth_api.get(reverse("analytics-heatmap"))
    assert resp.status_code == 200
    assert resp.json()["year"] == date.today().year
