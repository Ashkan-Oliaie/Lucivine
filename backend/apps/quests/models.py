import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class QuestCategory(models.TextChoices):
    STABILIZATION = "stabilization", "Stabilization"
    MANIFESTATION = "manifestation", "Manifestation"
    TRANSFORMATION = "transformation", "Transformation"
    ENVIRONMENTAL = "environmental", "Environmental"


class Quest(models.Model):
    """A challenge a seeker can take on. Replaces the old Spell entity.

    Quests can span one or more weeks of the program, can require prior
    quests to be completed, and can be toggled visible/hidden by admins.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True, max_length=64)
    name = models.CharField(max_length=80)
    tier = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    description = models.TextField()
    incantation = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=QuestCategory.choices)

    # Weeks the quest is available in. Empty list = all weeks.
    weeks = ArrayField(
        models.PositiveSmallIntegerField(),
        default=list,
        blank=True,
        help_text="Program weeks this quest belongs to. Empty = available every week.",
    )

    # Conditions
    min_lucid_count = models.PositiveIntegerField(
        default=0,
        help_text="Lucid dream count required before this quest unlocks.",
    )
    min_week = models.PositiveSmallIntegerField(
        default=1,
        help_text="Earliest program week the seeker must have reached.",
    )
    prerequisites = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="unlocks",
        help_text="Quests that must be completed before this one becomes available.",
    )

    # Whether the quest appears in the seeker-facing list at all.
    is_active = models.BooleanField(
        default=True,
        help_text="If false, this quest is hidden from the quests UI.",
    )

    class Meta:
        ordering = ("tier", "min_lucid_count", "name")

    def __str__(self) -> str:
        return f"T{self.tier} {self.name}"


class UserQuest(models.Model):
    """A seeker's tracking record for a quest.

    Created when the user 'takes on' a quest. Tracked quests are highlighted
    in the rail. Marked complete when the seeker fulfils it.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_quests",
    )
    quest = models.ForeignKey(
        Quest, on_delete=models.CASCADE, related_name="trackings"
    )
    is_tracked = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Self-reported progress, 0–100.",
    )

    class Meta:
        ordering = ("-started_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("user", "quest"), name="unique_user_quest"
            )
        ]
        indexes = [models.Index(fields=("user", "is_tracked"))]

    def __str__(self) -> str:
        return f"{self.user_id} ↪ {self.quest.slug}"


class QuestAttempt(models.Model):
    """A logged attempt at a quest inside a dream. Replaces SpellCast."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quest_attempts",
    )
    quest = models.ForeignKey(
        Quest, on_delete=models.PROTECT, related_name="attempts"
    )
    dream_entry = models.ForeignKey(
        "journal.DreamEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quest_attempts",
    )
    success_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    notes = models.TextField(blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-attempted_at",)
        indexes = [models.Index(fields=("user", "-attempted_at"))]

    def __str__(self) -> str:
        return f"{self.user_id} {self.quest.slug} ({self.success_rating}/5)"
