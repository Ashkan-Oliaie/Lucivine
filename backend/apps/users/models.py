import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.postgres.fields import ArrayField
from django.db import models


class ExperienceLevel(models.TextChoices):
    NEWCOMER = "newcomer", "Never recalled a dream / haven't tried lucid"
    RECALLER = "recaller", "Remembers dreams most mornings, no lucid yet"
    DABBLER = "dabbler", "1–3 lucid dreams ever"
    PRACTITIONER = "practitioner", "Lucid monthly+, knows MILD/WBTB"
    ADEPT = "adept", "Lucid weekly+, wants depth/control"


class Goal(models.TextChoices):
    RECALL = "recall", "Better dream recall"
    LUCIDITY = "lucidity", "Have a lucid dream"
    NIGHTMARES = "nightmares", "Reduce nightmares"
    CREATIVITY = "creativity", "Creative inspiration"
    HEALING = "healing", "Emotional healing"
    MEDITATION = "meditation", "Mindfulness practice"
    SLEEP_QUALITY = "sleep_quality", "Better sleep"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("email_verified", True)
        if extra.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=80, blank=True)
    avatar_url = models.URLField(blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    current_week = models.PositiveSmallIntegerField(default=1)
    streak_count = models.PositiveIntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    # Onboarding — captured the first time the user lands after signup.
    experience_level = models.CharField(
        max_length=16, choices=ExperienceLevel.choices, blank=True
    )
    goals = ArrayField(models.CharField(max_length=24), default=list, blank=True)
    typical_bedtime = models.TimeField(null=True, blank=True)
    onboarded_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    def __str__(self) -> str:
        return self.email
