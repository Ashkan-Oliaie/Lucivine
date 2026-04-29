import uuid

from django.conf import settings
from django.db import models

from .catalog import CHAKRA_IDS


class ChakraSession(models.Model):
    CHAKRA_CHOICES = [(cid, cid.title()) for cid in CHAKRA_IDS]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chakra_sessions",
    )
    chakra_id = models.CharField(max_length=16, choices=CHAKRA_CHOICES)
    duration_seconds = models.PositiveIntegerField()
    frequency_hz = models.PositiveIntegerField(null=True, blank=True)
    mantra = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-completed_at",)
        indexes = [
            models.Index(fields=("user", "-completed_at")),
            models.Index(fields=("user", "chakra_id")),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} {self.chakra_id} {self.duration_seconds}s"
