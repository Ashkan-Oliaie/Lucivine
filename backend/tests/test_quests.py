from datetime import date

import pytest
from django.urls import reverse

from apps.journal.models import DreamEntry
from apps.quests.models import Quest, QuestAttempt, UserQuest


@pytest.fixture
def quests(db):
    stabilize = Quest.objects.create(
        slug="stabilize",
        name="Stabilize",
        tier=1,
        description="Anchor lucidity by examining hands.",
        category="stabilization",
        weeks=[1, 2, 3, 4, 5, 6],
        min_lucid_count=0,
        min_week=1,
        is_active=True,
    )
    flight = Quest.objects.create(
        slug="flight",
        name="Flight",
        tier=3,
        description="Lift away from the ground.",
        category="environmental",
        weeks=[3, 4, 5, 6],
        min_lucid_count=7,
        min_week=3,
        is_active=True,
    )
    return [stabilize, flight]


def _give_lucid_dreams(user, n: int):
    for i in range(n):
        DreamEntry.objects.create(
            user=user,
            title=f"lucid {i}",
            dream_date=date.today(),
            is_lucid=True,
            technique_used="DILD",
        )


def test_quest_list_marks_unlocked(auth_api, user, quests):
    _give_lucid_dreams(user, 3)
    resp = auth_api.get(reverse("quest-list"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["lucid_count"] == 3
    by_slug = {q["slug"]: q for q in body["results"]}
    # stabilize: min_lucid=0, min_week=1 → unlocked when current_week >= 1
    # flight: min_lucid=7, min_week=3 → locked (only 3 lucid + likely week 1)
    assert by_slug["flight"]["unlocked"] is False


def test_log_attempt_for_locked_quest_rejected(auth_api, user, quests):
    flight = next(q for q in quests if q.slug == "flight")
    resp = auth_api.post(
        reverse("quest-attempt-list"),
        {"quest": str(flight.id), "success_rating": 4},
        format="json",
    )
    assert resp.status_code == 400


def test_log_attempt_for_unlocked_quest_succeeds(auth_api, user, quests):
    stabilize = next(q for q in quests if q.slug == "stabilize")
    _give_lucid_dreams(user, 1)
    resp = auth_api.post(
        reverse("quest-attempt-list"),
        {"quest": str(stabilize.id), "success_rating": 5, "notes": "felt rooted"},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert QuestAttempt.objects.filter(user=user, quest=stabilize).count() == 1


def test_attempt_with_others_dream_is_rejected(auth_api, user, quests, db):
    from django.contrib.auth import get_user_model

    other = get_user_model().objects.create_user(email="o@x.com", password="another-strong-pw-1")
    other_dream = DreamEntry.objects.create(
        user=other, title="not yours", dream_date=date.today(), is_lucid=True
    )
    stabilize = next(q for q in quests if q.slug == "stabilize")
    resp = auth_api.post(
        reverse("quest-attempt-list"),
        {
            "quest": str(stabilize.id),
            "dream_entry": str(other_dream.id),
            "success_rating": 3,
        },
        format="json",
    )
    assert resp.status_code == 400


def test_quest_log_groups_by_quest(auth_api, user, quests):
    stabilize = next(q for q in quests if q.slug == "stabilize")
    QuestAttempt.objects.create(user=user, quest=stabilize, success_rating=5)
    QuestAttempt.objects.create(user=user, quest=stabilize, success_rating=3)

    resp = auth_api.get(reverse("quest-log"))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    entry = body[0]
    assert entry["quest"]["slug"] == "stabilize"
    assert len(entry["attempts"]) == 2
    assert entry["avg_success"] == 4.0


def test_track_quest_creates_user_quest(auth_api, user, quests):
    stabilize = next(q for q in quests if q.slug == "stabilize")
    resp = auth_api.post(
        reverse("user-quest-list"),
        {"quest": str(stabilize.id)},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert UserQuest.objects.filter(user=user, quest=stabilize, is_tracked=True).count() == 1


def test_track_is_idempotent_and_re_enables(auth_api, user, quests):
    stabilize = next(q for q in quests if q.slug == "stabilize")
    UserQuest.objects.create(user=user, quest=stabilize, is_tracked=False)
    resp = auth_api.post(
        reverse("user-quest-list"),
        {"quest": str(stabilize.id)},
        format="json",
    )
    assert resp.status_code == 201
    uq = UserQuest.objects.get(user=user, quest=stabilize)
    assert uq.is_tracked is True
    # No duplicates created.
    assert UserQuest.objects.filter(user=user, quest=stabilize).count() == 1


def test_complete_action_marks_quest_complete(auth_api, user, quests):
    stabilize = next(q for q in quests if q.slug == "stabilize")
    uq = UserQuest.objects.create(user=user, quest=stabilize, is_tracked=True, progress=50)
    resp = auth_api.post(reverse("user-quest-complete", args=[uq.id]))
    assert resp.status_code == 200
    uq.refresh_from_db()
    assert uq.completed_at is not None
    assert uq.progress == 100
