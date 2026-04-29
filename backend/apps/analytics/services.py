"""Read-time aggregations. No models — everything is computed from existing tables.

Streaks are computed on-demand here rather than stored in a snapshot table.
For our scale (one user logs at most a handful of practices per day) this is
trivially fast and removes the need for a nightly job.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from typing import Iterable

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.journal.models import DreamEntry
from apps.meditation.models import ChakraSession
from apps.reality_checks.models import RealityCheck


def _practice_dates(user) -> set[date]:
    """All distinct dates on which the user logged any kind of practice."""
    rc = (
        RealityCheck.objects.filter(user=user)
        .annotate(d=TruncDate("performed_at"))
        .values_list("d", flat=True)
    )
    chakra = (
        ChakraSession.objects.filter(user=user)
        .annotate(d=TruncDate("completed_at"))
        .values_list("d", flat=True)
    )
    journal = DreamEntry.objects.filter(user=user).values_list("dream_date", flat=True)
    return {d for d in (*rc, *chakra, *journal) if d is not None}


def compute_streak(user, today: date | None = None) -> int:
    """Walk backwards from today; count consecutive days with any practice.

    Today is allowed to be empty without breaking the streak — we start counting
    from yesterday in that case.
    """
    today = today or timezone.localdate()
    practiced = _practice_dates(user)
    cursor = today if today in practiced else today - timedelta(days=1)
    streak = 0
    while cursor in practiced:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def dashboard_payload(user) -> dict:
    today = timezone.localdate()
    cutoff_30 = today - timedelta(days=30)

    journal_qs = DreamEntry.objects.filter(user=user)
    rc_qs = RealityCheck.objects.filter(user=user)
    chakra_qs = ChakraSession.objects.filter(user=user)

    journal_agg = journal_qs.aggregate(
        total=Count("id"),
        lucid=Count("id", filter=Q(is_lucid=True)),
        wild=Count("id", filter=Q(is_lucid=True, technique_used="WILD")),
    )
    chakra_agg = chakra_qs.aggregate(
        sessions=Count("id"), seconds=Sum("duration_seconds")
    )

    recent_lucids = list(
        journal_qs.filter(is_lucid=True)
        .order_by("-dream_date", "-created_at")
        .values("id", "title", "dream_date", "technique_used", "vividness")[:5]
    )

    return {
        "streak": compute_streak(user, today=today),
        "current_week": user.current_week,
        "totals": {
            "lucid_dreams": journal_agg["lucid"] or 0,
            "wild_successes": journal_agg["wild"] or 0,
            "dream_entries": journal_agg["total"] or 0,
            "reality_checks": rc_qs.count(),
            "chakra_sessions": chakra_agg["sessions"] or 0,
            "chakra_seconds": chakra_agg["seconds"] or 0,
        },
        "last_30_days": {
            "reality_checks": rc_qs.filter(performed_at__date__gte=cutoff_30).count(),
            "lucid_dreams": journal_qs.filter(
                dream_date__gte=cutoff_30, is_lucid=True
            ).count(),
            "chakra_minutes": (
                chakra_qs.filter(completed_at__date__gte=cutoff_30).aggregate(
                    s=Sum("duration_seconds")
                )["s"]
                or 0
            )
            // 60,
        },
        "recent_lucids": recent_lucids,
    }


def heatmap_payload(user, year: int) -> dict:
    """GitHub-style yearly heatmap. One row per day, with per-source counts."""
    start = date(year, 1, 1)
    end = date(year, 12, 31)

    rc = (
        RealityCheck.objects.filter(user=user, performed_at__date__range=(start, end))
        .annotate(d=TruncDate("performed_at"))
        .values("d")
        .annotate(c=Count("id"))
    )
    chakra = (
        ChakraSession.objects.filter(user=user, completed_at__date__range=(start, end))
        .annotate(d=TruncDate("completed_at"))
        .values("d")
        .annotate(c=Count("id"), seconds=Sum("duration_seconds"))
    )
    journal = (
        DreamEntry.objects.filter(user=user, dream_date__range=(start, end))
        .values("dream_date")
        .annotate(c=Count("id"), lucid=Count("id", filter=Q(is_lucid=True)))
    )

    days: dict[str, dict] = defaultdict(
        lambda: {
            "reality_checks": 0,
            "chakra_sessions": 0,
            "chakra_seconds": 0,
            "dream_entries": 0,
            "lucid_dreams": 0,
        }
    )
    for row in rc:
        days[str(row["d"])]["reality_checks"] = row["c"]
    for row in chakra:
        days[str(row["d"])]["chakra_sessions"] = row["c"]
        days[str(row["d"])]["chakra_seconds"] = row["seconds"] or 0
    for row in journal:
        days[str(row["dream_date"])]["dream_entries"] = row["c"]
        days[str(row["dream_date"])]["lucid_dreams"] = row["lucid"]

    return {
        "year": year,
        "days": [{"date": d, **counts} for d, counts in sorted(days.items())],
    }


def timeline_payload(user, metric: str, days: int) -> dict:
    today = timezone.localdate()
    start = today - timedelta(days=days - 1)

    if metric == "lucid_count":
        rows = (
            DreamEntry.objects.filter(user=user, dream_date__range=(start, today), is_lucid=True)
            .values("dream_date")
            .annotate(value=Count("id"))
        )
        series = {str(r["dream_date"]): r["value"] for r in rows}
    elif metric == "rc_count":
        rows = (
            RealityCheck.objects.filter(user=user, performed_at__date__range=(start, today))
            .annotate(d=TruncDate("performed_at"))
            .values("d")
            .annotate(value=Count("id"))
        )
        series = {str(r["d"]): r["value"] for r in rows}
    elif metric == "chakra_minutes":
        rows = (
            ChakraSession.objects.filter(
                user=user, completed_at__date__range=(start, today)
            )
            .annotate(d=TruncDate("completed_at"))
            .values("d")
            .annotate(seconds=Sum("duration_seconds"))
        )
        series = {str(r["d"]): (r["seconds"] or 0) // 60 for r in rows}
    else:
        raise ValueError(f"Unknown metric: {metric}")

    points = _fill_zero_dates(series, start, today)
    return {"metric": metric, "range_days": days, "points": points}


def _fill_zero_dates(series: dict[str, int], start: date, end: date) -> list[dict]:
    cursor = start
    out = []
    while cursor <= end:
        key = str(cursor)
        out.append({"date": key, "value": series.get(key, 0)})
        cursor += timedelta(days=1)
    return out


def known_metrics() -> Iterable[str]:
    return ("lucid_count", "rc_count", "chakra_minutes")
