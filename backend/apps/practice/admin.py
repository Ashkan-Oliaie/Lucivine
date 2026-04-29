from django.contrib import admin

from .models import UserProgress, WeeklyProgram


@admin.register(WeeklyProgram)
class WeeklyProgramAdmin(admin.ModelAdmin):
    list_display = ("week_number", "title", "primary_technique")
    ordering = ("week_number",)


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "week_number", "started_at", "completed_at")
    list_filter = ("week_number",)
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
