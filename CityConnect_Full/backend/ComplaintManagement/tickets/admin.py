from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "subject",
        "customer",
        "assigned_agent",
        "priority",
        "status",
        "created_at",
    )

    list_filter = (
        "priority",
        "status",
    )

    search_fields = (
        "subject",
        "description",
    )