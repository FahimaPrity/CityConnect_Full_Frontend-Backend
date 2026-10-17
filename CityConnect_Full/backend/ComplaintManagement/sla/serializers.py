from rest_framework import serializers
from .models import SLA


class SLASerializer(serializers.ModelSerializer):

    class Meta:
        model = SLA
        fields = [
            "id",
            "ticket",
            "started_at",
            "deadline",
            "completed_at",
            "is_breached",
            "created_at",
        ]

        read_only_fields = [
            "started_at",
            "deadline",
            "completed_at",
            "is_breached",
            "created_at",
        ]