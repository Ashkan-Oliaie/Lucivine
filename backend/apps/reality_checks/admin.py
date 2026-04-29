from django.contrib import admin

from .models import RealityCheck


@admin.register(RealityCheck)
class RealityCheckAdmin(admin.ModelAdmin):
    list_display = ("user", "method", "was_lucid_trigger", "performed_at")
    list_filter = ("method", "was_lucid_trigger")
    search_fields = ("user__email", "notes")
    autocomplete_fields = ("user",)
