from rest_framework import serializers

from .models import RealityCheck


class RealityCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealityCheck
        fields = ("id", "method", "was_lucid_trigger", "notes", "performed_at")
        read_only_fields = ("id", "performed_at")
