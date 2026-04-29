from django.urls import reverse

from apps.reality_checks.models import RealityCheck


def test_list_requires_auth(api):
    resp = api.get(reverse("reality-check-list"))
    assert resp.status_code == 401


def test_create_reality_check(auth_api, user):
    resp = auth_api.post(
        reverse("reality-check-list"),
        {"method": "hand", "notes": "fingers felt off"},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert RealityCheck.objects.filter(user=user).count() == 1


def test_user_only_sees_own_checks(auth_api, user, api, db):
    from django.contrib.auth import get_user_model

    other = get_user_model().objects.create_user(email="other@example.com", password="another-strong-pw-1")
    RealityCheck.objects.create(user=other, method="nose")
    RealityCheck.objects.create(user=user, method="hand")

    resp = auth_api.get(reverse("reality-check-list"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["method"] == "hand"


def test_stats_endpoint(auth_api, user):
    RealityCheck.objects.create(user=user, method="hand")
    RealityCheck.objects.create(user=user, method="hand")
    RealityCheck.objects.create(user=user, method="nose")

    resp = auth_api.get(reverse("reality-check-stats"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert body["by_method"] == {"hand": 2, "nose": 1}
