from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(
        source="recipient.username",
        read_only=True
    )

    ticket_subject = serializers.CharField(
        source="ticket.subject",
        read_only=True
    )