from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ExperienceLevel, Goal

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "display_name",
            "avatar_url",
            "timezone",
            "current_week",
            "streak_count",
            "last_practice_date",
            "email_verified",
            "date_joined",
            "experience_level",
            "goals",
            "typical_bedtime",
            "onboarded_at",
        )
        read_only_fields = (
            "id",
            "email",
            "streak_count",
            "last_practice_date",
            "email_verified",
            "date_joined",
            "onboarded_at",
        )


class OnboardingSerializer(serializers.Serializer):
    """Single-shot onboarding payload. All fields optional — skipping is allowed."""

    experience_level = serializers.ChoiceField(
        choices=ExperienceLevel.choices, required=False, allow_blank=True
    )
    goals = serializers.ListField(
        child=serializers.ChoiceField(choices=Goal.choices),
        required=False,
        allow_empty=True,
        max_length=3,
    )
    typical_bedtime = serializers.TimeField(required=False, allow_null=True)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=10)
    display_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    timezone = serializers.CharField(max_length=64, required=False, default="UTC")

    def validate_email(self, value: str) -> str:
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated):
        return User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            display_name=validated.get("display_name", ""),
            timezone=validated.get("timezone", "UTC"),
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class VerifyEmailSerializer(serializers.Serializer):
    code = serializers.RegexField(regex=r"^\d{6}$")


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()

    @classmethod
    def for_user(cls, user) -> dict:
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }
