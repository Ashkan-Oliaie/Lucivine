import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="seeker@lucivine.test",
        password="threshold-passage-9",
        display_name="Seeker",
    )


@pytest.fixture
def auth_api(api, user):
    refresh = RefreshToken.for_user(user)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api
