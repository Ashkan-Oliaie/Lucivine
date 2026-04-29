import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SpellCategory(models.TextChoices):
    STABILIZATION = "stabilization", "Stabilization"
    MANIFESTATION = "manifestation", "Manifestation"
    TRANSFORMATION = "transformation", "Transformation"
    ENVIRONMENTAL = "environmental", "Environmental"


class Spell(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True, max_length=64)
    name = models.CharField(max_length=80)
    tier = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    description = models.TextField()
    incantation = models.TextField(blank=True)
    unlock_threshold = models.PositiveIntegerField(
        help_text="Lucid dream count required to unlock this spell."
    )
    category = models.CharField(max_length=20, choices=SpellCategory.choices)

    class Meta:
        ordering = ("tier", "unlock_threshold", "name")

    def __str__(self) -> str:
        return f"T{self.tier} {self.name}"


class SpellCast(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="spell_casts",
    )
    spell = models.ForeignKey(Spell, on_delete=models.PROTECT, related_name="casts")
    dream_entry = models.ForeignKey(
        "journal.DreamEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="spell_casts",
    )
    success_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    notes = models.TextField(blank=True)
    cast_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-cast_at",)
        indexes = [models.Index(fields=("user", "-cast_at"))]

    def __str__(self) -> str:
        return f"{self.user_id} {self.spell.slug} ({self.success_rating}/5)"
