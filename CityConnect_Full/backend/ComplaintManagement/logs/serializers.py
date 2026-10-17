from rest_framework import serializers

from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
 actor_name = serializers.CharField(
source="actor.username",
read_only=True,
default=None,
)


ticket_subject = serializers.CharField(
    source="ticket.subject",
    read_only=True,
)

class Meta:
    model = ActivityLog

    fields = [
        "id",
        "ticket",
        "ticket_subject",
        "actor",
        "actor_name",
        "action",
        "description",
        "created_at",
    ]

    read_only_fields = [
        "id",
        "ticket",
        "ticket_subject",
        "actor",
        "actor_name",
        "action",
        "description",
        "created_at",
    ]
