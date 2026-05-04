import django.contrib.postgres.fields
import django.core.validators
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("journal", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Quest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("slug", models.SlugField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=80)),
                (
                    "tier",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ]
                    ),
                ),
                ("description", models.TextField()),
                ("incantation", models.TextField(blank=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("stabilization", "Stabilization"),
                            ("manifestation", "Manifestation"),
                            ("transformation", "Transformation"),
                            ("environmental", "Environmental"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "weeks",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.PositiveSmallIntegerField(),
                        blank=True,
                        default=list,
                        help_text="Program weeks this quest belongs to. Empty = available every week.",
                        size=None,
                    ),
                ),
                (
                    "min_lucid_count",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Lucid dream count required before this quest unlocks.",
                    ),
                ),
                (
                    "min_week",
                    models.PositiveSmallIntegerField(
                        default=1,
                        help_text="Earliest program week the seeker must have reached.",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="If false, this quest is hidden from the quests UI.",
                    ),
                ),
                (
                    "prerequisites",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Quests that must be completed before this one becomes available.",
                        related_name="unlocks",
                        to="quests.quest",
                    ),
                ),
            ],
            options={
                "ordering": ("tier", "min_lucid_count", "name"),
            },
        ),
        migrations.CreateModel(
            name="UserQuest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("is_tracked", models.BooleanField(default=True)),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "progress",
                    models.PositiveSmallIntegerField(
                        default=0,
                        help_text="Self-reported progress, 0–100.",
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                (
                    "quest",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="trackings",
                        to="quests.quest",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_quests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-started_at",),
                "indexes": [models.Index(fields=["user", "is_tracked"], name="quests_user_user_id_a02da4_idx")],
                "constraints": [
                    models.UniqueConstraint(fields=("user", "quest"), name="unique_user_quest"),
                ],
            },
        ),
        migrations.CreateModel(
            name="QuestAttempt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "success_rating",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ]
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                ("attempted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "dream_entry",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="quest_attempts",
                        to="journal.dreamentry",
                    ),
                ),
                (
                    "quest",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="attempts",
                        to="quests.quest",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quest_attempts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-attempted_at",),
                "indexes": [models.Index(fields=["user", "-attempted_at"], name="quests_ques_user_id_b9a4c2_idx")],
            },
        ),
    ]
