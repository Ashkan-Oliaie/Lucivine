import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Technique(models.TextChoices):
    DILD = "DILD", "DILD"
    WILD = "WILD", "WILD"
    MILD = "MILD", "MILD"
    WBTB = "WBTB", "WBTB"
    SSILD = "SSILD", "SSILD"


class WeeklyProgram(models.Model):
    week_number = models.PositiveSmallIntegerField(
        primary_key=True,
        validators=[MinValueValidator(1), MaxValueValidator(6)],
    )
    title = models.CharField(max_length=80)
    focus = models.CharField(max_length=160)
    daily_practices = ArrayField(models.CharField(max_length=64), default=list)
    primary_technique = models.CharField(max_length=16, choices=Technique.choices)
    technique_detail = models.TextField()
    recommended_chakras = ArrayField(models.CharField(max_length=16), default=list)

    class Meta:
        ordering = ("week_number",)

    def __str__(self) -> str:
        return f"Week {self.week_number}: {self.title}"


class UserProgress(models.Model):
    """Per-user, per-week progress with a daily completion log.

    `daily_completion_log` shape: { "YYYY-MM-DD": ["morning_recall", "rc_every_2h", ...] }
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="practice_progress",
    )
    week_number = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(6)],
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    daily_completion_log = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-started_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("user", "week_number"), name="uniq_user_week"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} W{self.week_number}"
