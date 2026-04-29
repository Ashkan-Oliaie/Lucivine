import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("reminders", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PushSubscription",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("endpoint", models.URLField(max_length=2048, unique=True)),
                ("p256dh", models.CharField(max_length=255)),
                ("auth", models.CharField(max_length=255)),
                ("user_agent", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_seen_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="push_subscriptions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "indexes": [models.Index(fields=["user"], name="reminders_p_user_id_b28a0a_idx")],
            },
        ),
        migrations.AlterField(
            model_name="reminder",
            name="channel",
            field=models.CharField(
                choices=[
                    ("push", "Web push"),
                    ("email", "Email"),
                    ("both", "Push + email"),
                ],
                default="push",
                max_length=8,
            ),
        ),
        migrations.AlterField(
            model_name="notificationlog",
            name="channel",
            field=models.CharField(
                choices=[
                    ("push", "Web push"),
                    ("email", "Email"),
                    ("both", "Push + email"),
                ],
                max_length=8,
            ),
        ),
    ]
