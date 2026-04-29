from django.contrib import admin

from .models import Spell, SpellCast


@admin.register(Spell)
class SpellAdmin(admin.ModelAdmin):
    list_display = ("name", "tier", "category", "unlock_threshold", "slug")
    list_filter = ("tier", "category")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(SpellCast)
class SpellCastAdmin(admin.ModelAdmin):
    list_display = ("user", "spell", "success_rating", "cast_at")
    list_filter = ("spell",)
    search_fields = ("user__email", "notes")
    autocomplete_fields = ("user", "spell", "dream_entry")
