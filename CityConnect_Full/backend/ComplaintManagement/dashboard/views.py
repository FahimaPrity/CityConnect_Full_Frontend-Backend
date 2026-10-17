
from django.db.models import Q
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sla.models import SLA
from tickets.models import Ticket

from .serializers import DashboardSummarySerializer


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == "admin":
            tickets = Ticket.objects.all()
        elif user.role == "agent":
            tickets = Ticket.objects.filter(assigned_agent=user)
        elif user.role == "customer":
            tickets = Ticket.objects.filter(customer=user)
        else:
            tickets = Ticket.objects.none()

        ticket_ids = tickets.values_list("id", flat=True)
        now = timezone.now()

        breached_slas = SLA.objects.filter(
            ticket_id__in=ticket_ids
        ).filter(
            Q(is_breached=True)
            | Q(
                completed_at__isnull=True,
                deadline__lt=now,
            )
        ).count()

        summary = {
            "total_tickets": tickets.count(),
            "open_tickets": tickets.filter(status="open").count(),
            "assigned_tickets": tickets.filter(status="assigned").count(),
            "in_progress_tickets": tickets.filter(
                status="in_progress"
            ).count(),
            "resolved_tickets": tickets.filter(
                status="resolved"
            ).count(),
            "closed_tickets": tickets.filter(status="closed").count(),
            "urgent_tickets": tickets.filter(priority="urgent").count(),
            "breached_slas": breached_slas,
        }

        serializer = DashboardSummarySerializer(instance=summary)
        return Response(serializer.data)