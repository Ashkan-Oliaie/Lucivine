from datetime import date

import pytest
from django.urls import reverse

from apps.journal.models import DreamEntry
from apps.spells.models import Spell, SpellCast


@pytest.fixture
def spells(db):
    return [
        Spell.objects.create(
            slug="stabilize",
            name="Stabilize",
            tier=1,
            description="Anchor lucidity by examining hands.",
            unlock_threshold=0,
            category="stabilization",
        ),
        Spell.objects.create(
            slug="flight",
            name="Flight",
            tier=3,
            description="Lift away from the ground.",
            unlock_threshold=7,
            category="environmental",
        ),
    ]


def _give_lucid_dreams(user, n: int):
    for i in range(n):
        DreamEntry.objects.create(
            user=user,
            title=f"lucid {i}",
            dream_date=date.today(),
            is_lucid=True,
            technique_used="DILD",
        )


def test_spell_list_marks_unlocked(auth_api, user, spells):
    _give_lucid_dreams(user, 3)
    resp = auth_api.get(reverse("spell-list"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["lucid_count"] == 3
    by_slug = {s["slug"]: s for s in body["results"]}
    assert by_slug["stabilize"]["unlocked"] is True
    assert by_slug["flight"]["unlocked"] is False


def test_cast_locked_spell_rejected(auth_api, user, spells):
    flight = next(s for s in spells if s.slug == "flight")
    resp = auth_api.post(
        reverse("spell-cast-list"),
        {"spell": str(flight.id), "success_rating": 4},
        format="json",
    )
    assert resp.status_code == 400


def test_cast_unlocked_spell_succeeds(auth_api, user, spells):
    stabilize = next(s for s in spells if s.slug == "stabilize")
    _give_lucid_dreams(user, 1)
    resp = auth_api.post(
        reverse("spell-cast-list"),
        {"spell": str(stabilize.id), "success_rating": 5, "notes": "felt rooted"},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert SpellCast.objects.filter(user=user, spell=stabilize).count() == 1


def test_cast_with_others_dream_is_rejected(auth_api, user, spells, db):
    from django.contrib.auth import get_user_model

    other = get_user_model().objects.create_user(email="o@x.com", password="another-strong-pw-1")
    other_dream = DreamEntry.objects.create(
        user=other, title="not yours", dream_date=date.today(), is_lucid=True
    )
    stabilize = next(s for s in spells if s.slug == "stabilize")
    resp = auth_api.post(
        reverse("spell-cast-list"),
        {
            "spell": str(stabilize.id),
            "dream_entry": str(other_dream.id),
            "success_rating": 3,
        },
        format="json",
    )
    assert resp.status_code == 400


def test_grimoire_groups_by_spell(auth_api, user, spells):
    stabilize = next(s for s in spells if s.slug == "stabilize")
    SpellCast.objects.create(user=user, spell=stabilize, success_rating=5)
    SpellCast.objects.create(user=user, spell=stabilize, success_rating=3)

    resp = auth_api.get(reverse("grimoire"))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    entry = body[0]
    assert entry["spell"]["slug"] == "stabilize"
    assert len(entry["casts"]) == 2
    assert entry["avg_success"] == 4.0
