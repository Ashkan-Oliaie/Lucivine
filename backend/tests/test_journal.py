from datetime import date

from django.urls import reverse

from apps.journal.models import DreamEntry


def _payload(**overrides):
    base = {
        "title": "The crystalline lake",
        "content": "I walked across reflected stars.",
        "dream_date": date.today().isoformat(),
        "is_lucid": False,
        "vividness": 7,
        "emotions": ["wonder", "calm"],
        "symbols": ["water", "mirror"],
    }
    base.update(overrides)
    return base


def test_list_requires_auth(api):
    resp = api.get(reverse("dream-entry-list"))
    assert resp.status_code == 401


def test_create_dream(auth_api, user):
    resp = auth_api.post(reverse("dream-entry-list"), _payload(), format="json")
    assert resp.status_code == 201, resp.content
    assert DreamEntry.objects.filter(user=user).count() == 1


def test_create_lucid_with_technique(auth_api):
    resp = auth_api.post(
        reverse("dream-entry-list"),
        _payload(
            is_lucid=True,
            technique_used="WILD",
            lucidity_duration_seconds=180,
            transition_stages_reached=[1, 2, 3, 4, 5],
        ),
        format="json",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["is_lucid"] is True
    assert body["technique_used"] == "WILD"
    assert body["transition_stages_reached"] == [1, 2, 3, 4, 5]


def test_user_only_sees_own(auth_api, user, db):
    from django.contrib.auth import get_user_model

    other = get_user_model().objects.create_user(email="o@x.com", password="another-strong-pw-1")
    DreamEntry.objects.create(user=other, title="theirs", dream_date=date.today())
    DreamEntry.objects.create(user=user, title="mine", dream_date=date.today())

    resp = auth_api.get(reverse("dream-entry-list"))
    assert resp.status_code == 200
    assert resp.json()["count"] == 1
    assert resp.json()["results"][0]["title"] == "mine"


def test_filter_by_lucid(auth_api, user):
    DreamEntry.objects.create(user=user, title="a", dream_date=date.today(), is_lucid=True, technique_used="DILD")
    DreamEntry.objects.create(user=user, title="b", dream_date=date.today(), is_lucid=False)
    resp = auth_api.get(reverse("dream-entry-list") + "?is_lucid=true")
    assert resp.status_code == 200
    assert resp.json()["count"] == 1


def test_search_content(auth_api, user):
    DreamEntry.objects.create(user=user, title="River", content="A glowing river", dream_date=date.today())
    DreamEntry.objects.create(user=user, title="Cave", content="Cold stone walls", dream_date=date.today())
    resp = auth_api.get(reverse("dream-entry-list") + "?search=river")
    assert resp.status_code == 200
    assert resp.json()["count"] == 1


def test_stats_shape(auth_api, user):
    DreamEntry.objects.create(user=user, title="x", dream_date=date.today(), is_lucid=True, technique_used="WILD", vividness=8)
    DreamEntry.objects.create(user=user, title="y", dream_date=date.today(), is_lucid=True, technique_used="DILD", vividness=6)
    DreamEntry.objects.create(user=user, title="z", dream_date=date.today(), is_lucid=False, vividness=4)

    resp = auth_api.get(reverse("dream-entry-stats"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert body["lucid_total"] == 2
    assert body["wild_total"] == 1
    assert body["by_technique"] == {"WILD": 1, "DILD": 1}
    assert body["avg_vividness"] == 6.0
