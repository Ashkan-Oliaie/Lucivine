from rest_framework import serializers

from .models import UserProgress, WeeklyProgram


class WeeklyProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyProgram
        fields = (
            "week_number",
            "title",
            "focus",
            "daily_practices",
            "primary_technique",
            "technique_detail",
            "recommended_chakras",
        )


class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = (
            "id",
            "week_number",
            "started_at",
            "completed_at",
            "daily_completion_log",
        )
        read_only_fields = ("id", "started_at", "daily_completion_log", "completed_at")


class CompleteDaySerializer(serializers.Serializer):
    date = serializers.DateField()
    practices = serializers.ListField(
        child=serializers.CharField(max_length=64), allow_empty=False
    )


class SetCurrentWeekSerializer(serializers.Serializer):
    week_number = serializers.IntegerField(min_value=1, max_value=6)
