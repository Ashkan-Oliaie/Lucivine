"""Data migration: copy spells.Spell → quests.Quest, spells.SpellCast → quests.QuestAttempt.

Preserves UUIDs, slugs, and category mappings so any external references
(e.g. dream entries linking back) continue to point at sane records.

Default week assignment is by tier — the program is six weeks; tier roughly
maps to depth: T1 from week 1, T2 from week 2, T3 from week 3, T4 from week 4,
T5 from week 5. `weeks=[]` would mean "every week" — we use explicit ranges so
the right-side rail can show different quests as the seeker progresses.
"""
from django.db import migrations


# Tier → starting week (quest is available in this week and onward).
_TIER_FIRST_WEEK = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5}
_TOTAL_WEEKS = 6


def copy_data(apps, schema_editor):
    try:
        Spell = apps.get_model("spells", "Spell")
        SpellCast = apps.get_model("spells", "SpellCast")
    except LookupError:
        # spells app already removed — nothing to copy.
        return

    Quest = apps.get_model("quests", "Quest")
    QuestAttempt = apps.get_model("quests", "QuestAttempt")

    spell_to_quest_id: dict = {}
    for spell in Spell.objects.all():
        first_week = _TIER_FIRST_WEEK.get(spell.tier, 1)
        weeks = list(range(first_week, _TOTAL_WEEKS + 1))
        quest = Quest.objects.create(
            id=spell.id,
            slug=spell.slug,
            name=spell.name,
            tier=spell.tier,
            description=spell.description,
            incantation=spell.incantation,
            category=spell.category,
            weeks=weeks,
            min_lucid_count=spell.unlock_threshold,
            min_week=first_week,
            is_active=True,
        )
        spell_to_quest_id[spell.id] = quest.id

    for cast in SpellCast.objects.all():
        QuestAttempt.objects.create(
            id=cast.id,
            user_id=cast.user_id,
            quest_id=spell_to_quest_id.get(cast.spell_id),
            dream_entry_id=cast.dream_entry_id,
            success_rating=cast.success_rating,
            notes=cast.notes,
            attempted_at=cast.cast_at,
        )


def reverse_copy(apps, schema_editor):
    Quest = apps.get_model("quests", "Quest")
    QuestAttempt = apps.get_model("quests", "QuestAttempt")
    QuestAttempt.objects.all().delete()
    Quest.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("quests", "0001_initial"),
        ("spells", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(copy_data, reverse_copy),
    ]
