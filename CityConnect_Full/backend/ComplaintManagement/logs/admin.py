
from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "ticket",
        "actor",
        "action",
        "created_at",
    )

    list_filter = (
        "action",
        "created_at",
    )

    search_fields = (
        "ticket__subject",
        "actor__username",
        "description",
    )

    readonly_fields = (
        "ticket",
        "actor",
        "action",
        "description",
        "created_at",
    )