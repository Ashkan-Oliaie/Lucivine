from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()


def test_register_creates_user_and_returns_tokens(api, db):
    resp = api.post(
        reverse("users:register"),
        {
            "email": "Newcomer@Example.com",
            "password": "moonrise-passage-7",
            "display_name": "Newcomer",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert "access" in body and "refresh" in body
    assert body["user"]["email"] == "newcomer@example.com"
    assert User.objects.filter(email="newcomer@example.com").exists()


def test_register_rejects_duplicate_email(api, user):
    resp = api.post(
        reverse("users:register"),
        {"email": user.email, "password": "another-strong-pw-1"},
        format="json",
    )
    assert resp.status_code == 400


def test_register_rejects_weak_password(api, db):
    resp = api.post(
        reverse("users:register"),
        {"email": "weak@example.com", "password": "short"},
        format="json",
    )
    assert resp.status_code == 400


def test_login_returns_tokens(api, user):
    resp = api.post(
        reverse("users:login"),
        {"email": user.email, "password": "threshold-passage-9"},
        format="json",
    )
    assert resp.status_code == 200, resp.content
    assert "access" in resp.json()


def test_login_rejects_bad_credentials(api, user):
    resp = api.post(
        reverse("users:login"),
        {"email": user.email, "password": "wrong-password-1234"},
        format="json",
    )
    assert resp.status_code == 401


def test_me_requires_auth(api):
    resp = api.get(reverse("users:me"))
    assert resp.status_code == 401


def test_me_returns_current_user(auth_api, user):
    resp = auth_api.get(reverse("users:me"))
    assert resp.status_code == 200
    assert resp.json()["email"] == user.email


def test_me_patch_updates_profile(auth_api):
    resp = auth_api.patch(
        reverse("users:me"),
        {"display_name": "Awakened", "timezone": "Australia/Sydney"},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "Awakened"
    assert resp.json()["timezone"] == "Australia/Sydney"


def test_verify_email_requires_auth(api):
    resp = api.post(reverse("users:verify-email"), {"code": "111111"}, format="json")
    assert resp.status_code == 401


def test_verify_email_with_correct_code(auth_api, user):
    assert user.email_verified is False
    resp = auth_api.post(
        reverse("users:verify-email"), {"code": "111111"}, format="json"
    )
    assert resp.status_code == 200, resp.content
    assert resp.json()["email_verified"] is True
    user.refresh_from_db()
    assert user.email_verified is True


def test_verify_email_rejects_wrong_code(auth_api, user):
    resp = auth_api.post(
        reverse("users:verify-email"), {"code": "999999"}, format="json"
    )
    assert resp.status_code == 400
    user.refresh_from_db()
    assert user.email_verified is False


def test_verify_email_validates_format(auth_api):
    resp = auth_api.post(
        reverse("users:verify-email"), {"code": "abcdef"}, format="json"
    )
    assert resp.status_code == 400


def test_verify_email_idempotent(auth_api, user):
    user.email_verified = True
    user.save()
    resp = auth_api.post(
        reverse("users:verify-email"), {"code": "111111"}, format="json"
    )
    assert resp.status_code == 200
    assert resp.json()["email_verified"] is True
