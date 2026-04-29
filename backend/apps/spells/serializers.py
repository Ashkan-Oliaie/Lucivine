from rest_framework import serializers

from .models import Spell, SpellCast


class SpellSerializer(serializers.ModelSerializer):
    unlocked = serializers.SerializerMethodField()
    cast_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Spell
        fields = (
            "id",
            "slug",
            "name",
            "tier",
            "description",
            "incantation",
            "unlock_threshold",
            "category",
            "unlocked",
            "cast_count",
        )

    def get_unlocked(self, obj: Spell) -> bool:
        lucid_count = self.context.get("lucid_count", 0)
        return lucid_count >= obj.unlock_threshold


class SpellCastSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpellCast
        fields = (
            "id",
            "spell",
            "dream_entry",
            "success_rating",
            "notes",
            "cast_at",
        )
        read_only_fields = ("id", "cast_at")

    def validate(self, attrs):
        user = self.context["request"].user
        spell = attrs["spell"]
        lucid_count = user.dream_entries.filter(is_lucid=True).count()
        if lucid_count < spell.unlock_threshold:
            raise serializers.ValidationError(
                {
                    "spell": (
                        f"This spell unlocks at {spell.unlock_threshold} lucid dream(s); "
                        f"you have {lucid_count}."
                    )
                }
            )
        dream = attrs.get("dream_entry")
        if dream is not None and dream.user_id != user.id:
            raise serializers.ValidationError({"dream_entry": "Not your dream entry."})
        return attrs
