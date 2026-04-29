from rest_framework import serializers

from .catalog import CHAKRA_IDS
from .models import ChakraSession


class ChakraSessionSerializer(serializers.ModelSerializer):
    chakra_id = serializers.ChoiceField(choices=CHAKRA_IDS)

    class Meta:
        model = ChakraSession
        fields = (
            "id",
            "chakra_id",
            "duration_seconds",
            "frequency_hz",
            "mantra",
            "notes",
            "completed_at",
        )
        read_only_fields = ("id", "completed_at")
