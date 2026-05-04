from rest_framework import serializers

from .models import PushSubscription, Reminder


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ("id", "endpoint", "p256dh", "auth", "user_agent", "created_at")
        read_only_fields = ("id", "created_at")


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = (
            "id",
            "kind",
            "label",
            "cadence",
            "time_of_day",
            "active_until",
            "interval_minutes",
            "channel",
            "enabled",
            "next_fire_at",
            "last_fired_at",
            "created_at",
            "practice_slug",
        )
        read_only_fields = ("id", "next_fire_at", "last_fired_at", "created_at")

    def validate(self, attrs):
        cadence = attrs.get("cadence") or getattr(self.instance, "cadence", None)
        if cadence == Reminder.Cadence.INTERVAL:
            interval = attrs.get("interval_minutes") or getattr(self.instance, "interval_minutes", None)
            active_until = attrs.get("active_until") or getattr(self.instance, "active_until", None)
            if not interval:
                raise serializers.ValidationError(
                    {"interval_minutes": "Required for interval cadence."}
                )
            if interval < 1 or interval > 1440:
                raise serializers.ValidationError(
                    {"interval_minutes": "Interval must be between 1 and 1440 minutes (24 hours)."}
                )
            if not active_until:
                raise serializers.ValidationError(
                    {"active_until": "Required for interval cadence."}
                )
        return attrs
