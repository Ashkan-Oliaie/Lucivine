from django.contrib import admin

from .models import NotificationLog, Reminder


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "cadence", "time_of_day", "enabled", "next_fire_at")
    list_filter = ("kind", "cadence", "enabled")
    search_fields = ("user__email", "label")
    autocomplete_fields = ("user",)


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("reminder", "channel", "delivered", "sent_at")
    list_filter = ("channel", "delivered")
    search_fields = ("reminder__user__email",)
