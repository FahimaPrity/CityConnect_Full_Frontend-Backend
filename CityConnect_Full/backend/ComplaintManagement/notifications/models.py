from django.conf import settings
from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("ticket_created", "Ticket Created"),
        ("ticket_assigned", "Ticket Assigned"),
        ("status_changed", "Status Changed"),
        ("priority_changed", "Priority Changed"),
        ("ticket_resolved", "Ticket Resolved"),
    ]
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Notification for {self.recipient.username}: "
            f"{self.message}"
        )