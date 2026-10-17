
from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("ticket_created", "Ticket Created"),
        ("ticket_assigned", "Ticket Assigned"),
        ("status_changed", "Status Changed"),
        ("priority_changed", "Priority Changed"),
        ("ticket_resolved", "Ticket Resolved"),
    ]

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
    )

    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket #{self.ticket.id}: {self.action}"