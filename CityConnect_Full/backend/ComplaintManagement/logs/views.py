from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogListView(generics.ListAPIView):
 serializer_class = ActivityLogSerializer
permission_classes = [IsAuthenticated]


def get_queryset(self):
    user = self.request.user

    if user.role == "admin":
        return ActivityLog.objects.select_related(
            "ticket",
            "actor",
        ).order_by("-created_at")

    if user.role == "agent":
        return ActivityLog.objects.filter(
            ticket__assigned_agent=user
        ).select_related(
            "ticket",
            "actor",
        ).order_by("-created_at")

    if user.role == "customer":
        return ActivityLog.objects.filter(
            ticket__customer=user
        ).select_related(
            "ticket",
            "actor",
        ).order_by("-created_at")

    return ActivityLog.objects.none()
