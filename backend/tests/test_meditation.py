from django.urls import reverse

from apps.meditation.models import ChakraSession


def test_chakra_catalog_is_public(api):
    resp = api.get(reverse("chakra-catalog"))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 7
    assert {c["id"] for c in body} == {
        "root",
        "sacral",
        "solar",
        "heart",
        "throat",
        "thirdeye",
        "crown",
    }
    # spec says each chakra has a frequency_hz and mantra
    for c in body:
        assert "frequency_hz" in c
        assert "mantra" in c
        assert "color" in c


def test_create_chakra_session(auth_api, user):
    resp = auth_api.post(
        reverse("chakra-session-list"),
        {
            "chakra_id": "thirdeye",
            "duration_seconds": 600,
            "frequency_hz": 852,
            "mantra": "OM",
            "notes": "Visions of indigo gates.",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert ChakraSession.objects.filter(user=user).count() == 1


def test_invalid_chakra_rejected(auth_api):
    resp = auth_api.post(
        reverse("chakra-session-list"),
        {"chakra_id": "atlantis", "duration_seconds": 60},
        format="json",
    )
    assert resp.status_code == 400


def test_user_only_sees_own_sessions(auth_api, user, db):
    from django.contrib.auth import get_user_model

    other = get_user_model().objects.create_user(email="o@x.com", password="another-strong-pw-1")
    ChakraSession.objects.create(user=other, chakra_id="root", duration_seconds=60)
    ChakraSession.objects.create(user=user, chakra_id="heart", duration_seconds=120)

    resp = auth_api.get(reverse("chakra-session-list"))
    assert resp.status_code == 200
    assert resp.json()["count"] == 1
    assert resp.json()["results"][0]["chakra_id"] == "heart"


def test_stats(auth_api, user):
    ChakraSession.objects.create(user=user, chakra_id="heart", duration_seconds=300)
    ChakraSession.objects.create(user=user, chakra_id="heart", duration_seconds=600)
    ChakraSession.objects.create(user=user, chakra_id="thirdeye", duration_seconds=900)

    resp = auth_api.get(reverse("chakra-session-stats"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_sessions"] == 3
    assert body["total_seconds"] == 1800
    per = {p["chakra_id"]: p for p in body["per_chakra"]}
    assert per["heart"]["sessions"] == 2
    assert per["heart"]["seconds"] == 900
    assert per["thirdeye"]["seconds"] == 900
