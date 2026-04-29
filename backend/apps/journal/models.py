import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Technique(models.TextChoices):
    DILD = "DILD", "Dream-Initiated Lucid Dream"
    WILD = "WILD", "Wake-Initiated Lucid Dream"
    MILD = "MILD", "Mnemonic-Induced Lucid Dream"
    WBTB = "WBTB", "Wake Back to Bed"
    SSILD = "SSILD", "Senses-Initiated Lucid Dream"
    OTHER = "other", "Other"


class DreamEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dream_entries",
    )
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    dream_date = models.DateField()

    is_lucid = models.BooleanField(default=False)
    lucidity_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    technique_used = models.CharField(
        max_length=16, choices=Technique.choices, blank=True, default=""
    )
    vividness = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        null=True,
        blank=True,
    )
    emotions = ArrayField(models.CharField(max_length=40), default=list, blank=True)
    symbols = ArrayField(models.CharField(max_length=40), default=list, blank=True)
    transition_stages_reached = ArrayField(
        models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)]),
        default=list,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-dream_date", "-created_at")
        indexes = [
            models.Index(fields=("user", "-dream_date")),
            models.Index(fields=("user", "is_lucid")),
        ]

    def __str__(self) -> str:
        return f"{self.dream_date} — {self.title}"
