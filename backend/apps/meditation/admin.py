from django.contrib import admin

from .models import ChakraSession


@admin.register(ChakraSession)
class ChakraSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "chakra_id", "duration_seconds", "completed_at")
    list_filter = ("chakra_id",)
    search_fields = ("user__email", "notes")
    autocomplete_fields = ("user",)
