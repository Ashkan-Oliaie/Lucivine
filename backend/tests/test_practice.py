from datetime import date

import pytest
from django.urls import reverse

from apps.practice.models import UserProgress, WeeklyProgram


@pytest.fixture
def program(db):
    """Program rows. The 0003 data migration already seeds the v2 curriculum;
    use update_or_create so the fixture can run on top of the seeded rows."""
    weeks = []
    for i in range(1, 7):
        obj, _ = WeeklyProgram.objects.update_or_create(
            week_number=i,
            defaults={
                "title": f"Week {i}",
                "focus": "focus",
                "daily_practices": ["morning_recall", "rc_every_2h"],
                "primary_technique": "DILD",
                "technique_detail": "detail",
                "recommended_chakras": ["thirdeye"],
            },
        )
        weeks.append(obj)
    return weeks


def test_program_is_public(api, program):
    resp = api.get(reverse("weekly-program"))
    assert resp.status_code == 200
    assert len(resp.json()) == 6


def test_progress_requires_auth(api):
    resp = api.get(reverse("user-progress"))
    assert resp.status_code == 401


def test_complete_day_creates_progress(auth_api, user, program):
    url = reverse("complete-day", kwargs={"week_number": 1})
    resp = auth_api.post(
        url,
        {"date": date.today().isoformat(), "practices": ["morning_recall", "rc_every_2h"]},
        format="json",
    )
    assert resp.status_code == 200, resp.content

    progress = UserProgress.objects.get(user=user, week_number=1)
    log = progress.daily_completion_log
    assert log[date.today().isoformat()] == ["morning_recall", "rc_every_2h"]


def test_complete_day_is_idempotent_and_merges(auth_api, user, program):
    url = reverse("complete-day", kwargs={"week_number": 1})
    today = date.today().isoformat()
    auth_api.post(url, {"date": today, "practices": ["morning_recall"]}, format="json")
    auth_api.post(url, {"date": today, "practices": ["morning_recall", "journal_entry"]}, format="json")

    progress = UserProgress.objects.get(user=user, week_number=1)
    assert progress.daily_completion_log[today] == ["journal_entry", "morning_recall"]
    assert UserProgress.objects.filter(user=user, week_number=1).count() == 1


def test_complete_day_unknown_week_returns_404(auth_api, program):
    url = reverse("complete-day", kwargs={"week_number": 99})
    resp = auth_api.post(
        url,
        {"date": date.today().isoformat(), "practices": ["morning_recall"]},
        format="json",
    )
    assert resp.status_code == 404


def test_set_current_week_updates_user(auth_api, user, program):
    resp = auth_api.patch(reverse("set-current-week"), {"week_number": 3}, format="json")
    assert resp.status_code == 200, resp.content
    user.refresh_from_db()
    assert user.current_week == 3
    assert UserProgress.objects.filter(user=user, week_number=3).exists()


def test_set_current_week_validates_range(auth_api, program):
    resp = auth_api.patch(reverse("set-current-week"), {"week_number": 9}, format="json")
    assert resp.status_code == 400
