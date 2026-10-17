from django.db import models
from django.utils import timezone
from tickets.models import Ticket


class SLA(models.Model):

    ticket = models.OneToOneField(
        Ticket,
        on_delete=models.CASCADE,
        related_name="sla"
    )

    started_at = models.DateTimeField()
    deadline = models.DateTimeField()

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    is_breached = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def check_breach(self):
        if self.completed_at is None:
            if timezone.now() > self.deadline:
                self.is_breached = True
                self.save(update_fields=["is_breached"])

        return self.is_breached

    def __str__(self):
        return f"SLA - Ticket #{self.ticket.id}"