from rest_framework import serializers

from .models import DreamEntry


class DreamEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DreamEntry
        fields = (
            "id",
            "title",
            "content",
            "dream_date",
            "is_lucid",
            "lucidity_duration_seconds",
            "technique_used",
            "vividness",
            "emotions",
            "symbols",
            "transition_stages_reached",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
