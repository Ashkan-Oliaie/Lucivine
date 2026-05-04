from rest_framework import serializers

from .models import Quest, QuestAttempt, UserQuest


class QuestSerializer(serializers.ModelSerializer):
    unlocked = serializers.SerializerMethodField()
    attempt_count = serializers.IntegerField(read_only=True, default=0)
    is_tracked = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    prerequisites = serializers.SlugRelatedField(
        slug_field="slug", many=True, read_only=True
    )

    class Meta:
        model = Quest
        fields = (
            "id",
            "slug",
            "name",
            "tier",
            "description",
            "incantation",
            "category",
            "weeks",
            "min_lucid_count",
            "min_week",
            "prerequisites",
            "is_active",
            "unlocked",
            "attempt_count",
            "is_tracked",
            "is_completed",
            "progress",
        )

    def _user_quest(self, obj: Quest) -> UserQuest | None:
        index: dict = self.context.get("user_quest_by_id", {})
        return index.get(obj.id)

    def get_unlocked(self, obj: Quest) -> bool:
        lucid_count = self.context.get("lucid_count", 0)
        current_week = self.context.get("current_week", 1)
        completed_quest_ids = self.context.get("completed_quest_ids", set())
        if lucid_count < obj.min_lucid_count:
            return False
        if current_week < obj.min_week:
            return False
        prereq_ids = self.context.get("prereq_index", {}).get(obj.id, [])
        return all(pid in completed_quest_ids for pid in prereq_ids)

    def get_is_tracked(self, obj: Quest) -> bool:
        uq = self._user_quest(obj)
        return bool(uq and uq.is_tracked)

    def get_is_completed(self, obj: Quest) -> bool:
        uq = self._user_quest(obj)
        return bool(uq and uq.completed_at is not None)

    def get_progress(self, obj: Quest) -> int:
        uq = self._user_quest(obj)
        return uq.progress if uq else 0


class UserQuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserQuest
        fields = (
            "id",
            "quest",
            "is_tracked",
            "started_at",
            "completed_at",
            "progress",
        )
        read_only_fields = ("id", "started_at")


class QuestAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestAttempt
        fields = (
            "id",
            "quest",
            "dream_entry",
            "success_rating",
            "notes",
            "attempted_at",
        )
        read_only_fields = ("id", "attempted_at")

    def validate(self, attrs):
        user = self.context["request"].user
        quest = attrs["quest"]
        if not quest.is_active:
            raise serializers.ValidationError({"quest": "This quest is currently unavailable."})
        lucid_count = user.dream_entries.filter(is_lucid=True).count()
        if lucid_count < quest.min_lucid_count:
            raise serializers.ValidationError(
                {
                    "quest": (
                        f"Quest unlocks at {quest.min_lucid_count} lucid dream(s); "
                        f"you have {lucid_count}."
                    )
                }
            )
        dream = attrs.get("dream_entry")
        if dream is not None and dream.user_id != user.id:
            raise serializers.ValidationError({"dream_entry": "Not your dream entry."})
        return attrs
