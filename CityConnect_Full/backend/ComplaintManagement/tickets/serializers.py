
from rest_framework import serializers

from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.username",
        read_only=True,
    )

    assigned_agent_name = serializers.CharField(
        source="assigned_agent.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Ticket

        fields = [
            "id",
            "customer",
            "customer_name",
            "assigned_agent",
            "assigned_agent_name",
            "subject",
            "description",
            "priority",
            "status",
            "created_at",
            "updated_at",
            "resolved_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "assigned_agent",
            "assigned_agent_name",
            "status",
            "created_at",
            "updated_at",
            "resolved_at",
        ]