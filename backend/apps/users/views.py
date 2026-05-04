import hmac

from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import ExperienceLevel
from .serializers import (
    LoginSerializer,
    OnboardingSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)


# Experience-level → starting week mapping. See proposal in chat for rationale.
START_WEEK_BY_LEVEL: dict[str, int] = {
    ExperienceLevel.NEWCOMER: 1,
    ExperienceLevel.RECALLER: 2,
    ExperienceLevel.DABBLER: 2,
    ExperienceLevel.PRACTITIONER: 3,
    ExperienceLevel.ADEPT: 5,
}


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(TokenPairSerializer.for_user(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"].lower(),
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(TokenPairSerializer.for_user(user))


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    http_method_names = ("get", "patch", "head", "options")

    def get_object(self):
        return self.request.user


class VerifyEmailView(APIView):
    """Mark the current user's email as verified.

    For now everyone shares a fixed code from settings. When real email sending
    lands, swap the comparison for a per-user stored hash with an expiry.
    """

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provided = serializer.validated_data["code"]
        if not hmac.compare_digest(provided, settings.DEFAULT_EMAIL_VERIFICATION_CODE):
            return Response(
                {"detail": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.email_verified:
            request.user.email_verified = True
            request.user.save(update_fields=["email_verified"])
        return Response(UserSerializer(request.user).data)


class OnboardingView(APIView):
    """POST /api/users/onboarding/ — capture first-run preferences and start the program.

    All inputs are optional. If `experience_level` is provided, the user's
    `current_week` is set to the matching start week (existing UserProgress for
    weeks > 1 are seeded by the practice app on first /set-current-week call).
    """

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        if "experience_level" in data and data["experience_level"]:
            user.experience_level = data["experience_level"]
            user.current_week = START_WEEK_BY_LEVEL.get(data["experience_level"], 1)
        if "goals" in data:
            user.goals = list(data["goals"])
        if "typical_bedtime" in data:
            user.typical_bedtime = data["typical_bedtime"]

        user.onboarded_at = timezone.now()
        user.save(
            update_fields=[
                "experience_level",
                "goals",
                "typical_bedtime",
                "current_week",
                "onboarded_at",
            ]
        )

        # Seed a UserProgress row for the chosen start week so the program
        # screen renders correctly without an extra round-trip.
        from apps.practice.models import UserProgress, WeeklyProgram

        if WeeklyProgram.objects.filter(week_number=user.current_week).exists():
            UserProgress.objects.get_or_create(user=user, week_number=user.current_week)

        return Response(UserSerializer(user).data)


class SkipOnboardingView(APIView):
    """POST /api/users/onboarding/skip/ — mark onboarded, start at Week 1."""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        request.user.onboarded_at = timezone.now()
        request.user.save(update_fields=["onboarded_at"])
        return Response(UserSerializer(request.user).data)


__all__ = (
    "RegisterView",
    "LoginView",
    "LogoutView",
    "MeView",
    "OnboardingView",
    "SkipOnboardingView",
    "VerifyEmailView",
    "TokenRefreshView",
)
