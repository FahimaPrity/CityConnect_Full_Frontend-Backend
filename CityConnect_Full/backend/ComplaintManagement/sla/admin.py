from django.contrib import admin
from .models import SLA


@admin.register(SLA)
class SLAAdmin(admin.ModelAdmin):

    list_display = (
        "ticket",
        "started_at",
        "deadline",
        "completed_at",
        "is_breached",
    )

    list_filter = (
        "is_breached",
    )