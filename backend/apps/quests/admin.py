from django.contrib import admin

from .models import Quest, QuestAttempt, UserQuest


@admin.register(Quest)
class QuestAdmin(admin.ModelAdmin):
    list_display = ("name", "tier", "category", "min_lucid_count", "min_week", "is_active", "slug")
    list_filter = ("tier", "category", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("prerequisites",)
    list_editable = ("is_active",)


@admin.register(UserQuest)
class UserQuestAdmin(admin.ModelAdmin):
    list_display = ("user", "quest", "is_tracked", "progress", "completed_at", "started_at")
    list_filter = ("is_tracked", "quest")
    search_fields = ("user__email",)
    autocomplete_fields = ("user", "quest")


@admin.register(QuestAttempt)
class QuestAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "quest", "success_rating", "attempted_at")
    list_filter = ("quest",)
    search_fields = ("user__email", "notes")
    autocomplete_fields = ("user", "quest", "dream_entry")
