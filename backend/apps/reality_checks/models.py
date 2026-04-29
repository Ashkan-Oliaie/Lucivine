import uuid

from django.conf import settings
from django.db import models


class RealityCheck(models.Model):
    class Method(models.TextChoices):
        HAND = "hand", "Look at hands"
        NOSE = "nose", "Pinch nose breath"
        TEXT = "text", "Re-read text"
        CLOCK = "clock", "Read clock twice"
        LIGHT = "light", "Light switch"
        MIRROR = "mirror", "Look in mirror"
        MEMORY = "memory", "Recall last hour"
        JUMP = "jump", "Jump and float"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reality_checks",
    )
    method = models.CharField(max_length=16, choices=Method.choices)
    was_lucid_trigger = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    performed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-performed_at",)
        indexes = [models.Index(fields=("user", "-performed_at"))]

    def __str__(self) -> str:
        return f"{self.user_id} {self.method} @ {self.performed_at:%Y-%m-%d %H:%M}"
