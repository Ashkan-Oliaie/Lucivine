from django.contrib import admin

from .models import DreamEntry


@admin.register(DreamEntry)
class DreamEntryAdmin(admin.ModelAdmin):
    list_display = ("dream_date", "title", "user", "is_lucid", "technique_used", "vividness")
    list_filter = ("is_lucid", "technique_used")
    search_fields = ("title", "content", "user__email")
    autocomplete_fields = ("user",)
    date_hierarchy = "dream_date"
