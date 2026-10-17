
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from logs.models import ActivityLog
from notifications.email_service import send_ticket_email
from notifications.models import Notification
from sla.models import SLA

from .models import Ticket
from .serializers import TicketSerializer


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "customer":
            return Ticket.objects.filter(customer=user)

        if user.role == "agent":
            return Ticket.objects.filter(assigned_agent=user)

        if user.role == "admin":
            return Ticket.objects.all()

        return Ticket.objects.none()

    def create_notification(
        self, recipient, ticket, notification_type, message
    ):
        Notification.objects.create(
            recipient=recipient,
            ticket=ticket,
            notification_type=notification_type,
            message=message,
        )

        # Send an email if the recipient has an email address.
        # The email helper catches sending errors, so an email failure
        # will not interrupt the ticket operation.
        if recipient.email:
            send_ticket_email(
                recipient_email=recipient.email,
                subject=f"Complaint Management: Ticket #{ticket.id}",
                message=message,
            )

    def create_activity_log(self, ticket, actor, action, description):
        ActivityLog.objects.create(
            ticket=ticket,
            actor=actor,
            action=action,
            description=description,
        )

    def create(self, request, *args, **kwargs):
        if request.user.role != "customer":
            return Response(
                {"detail": "Only customers can submit tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        sla_hours = {
            "low": 72,
            "medium": 48,
            "high": 24,
            "urgent": 8,
        }

        with transaction.atomic():
            ticket = serializer.save(customer=self.request.user)

            started_at = timezone.now()

            SLA.objects.create(
                ticket=ticket,
                started_at=started_at,
                deadline=started_at + timedelta(
                    hours=sla_hours[ticket.priority]
                ),
            )

            message = (
                f"Your complaint ticket #{ticket.id} "
                f"has been created successfully."
            )

            self.create_notification(
                recipient=ticket.customer,
                ticket=ticket,
                notification_type="ticket_created",
                message=message,
            )

            self.create_activity_log(
                ticket=ticket,
                actor=self.request.user,
                action="ticket_created",
                description=f"Ticket #{ticket.id} was created.",
            )

    @action(detail=False, methods=["get"])
    def queue(self, request):
        user = request.user

        if user.role == "agent":
            tickets = Ticket.objects.filter(
                assigned_agent=user,
                status__in=["open", "assigned", "in_progress"],
            )
        elif user.role == "admin":
            tickets = Ticket.objects.filter(
                status__in=["open", "assigned", "in_progress"],
            )
        else:
            return Response(
                {"detail": "Only agents and admins can access the queue."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tickets = tickets.order_by("-created_at")

        return Response(
            self.get_serializer(tickets, many=True).data
        )

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        ticket = self.get_object()

        if request.user.role not in ["agent", "admin"]:
            return Response(
                {"detail": "Only agents and admins can update status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        valid_statuses = [
            "open", "assigned", "in_progress", "resolved", "closed"
        ]

        if new_status not in valid_statuses:
            return Response(
                {"detail": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = ticket.status

        if old_status == new_status:
            return Response(TicketSerializer(ticket).data)

        with transaction.atomic():
            now = timezone.now()
            ticket.status = new_status

            if new_status == "resolved":
                ticket.resolved_at = now
            elif old_status == "resolved":
                ticket.resolved_at = None

            ticket.save()

            try:
                sla = ticket.sla

                if new_status == "resolved":
                    sla.completed_at = now
                    sla.is_breached = now > sla.deadline
                elif old_status == "resolved":
                    sla.completed_at = None
                    sla.is_breached = now > sla.deadline

                sla.save(
                    update_fields=["completed_at", "is_breached"]
                )
            except SLA.DoesNotExist:
                pass

            notification_type = (
                "ticket_resolved"
                if new_status == "resolved"
                else "status_changed"
            )

            message = (
                f"Ticket #{ticket.id} status changed "
                f"from {old_status} to {new_status}."
            )

            recipients = [ticket.customer]

            if ticket.assigned_agent:
                recipients.append(ticket.assigned_agent)

            # Avoid sending duplicate notifications to the same user.
            unique_recipients = {
                recipient.id: recipient for recipient in recipients
            }

            for recipient in unique_recipients.values():
                self.create_notification(
                    recipient=recipient,
                    ticket=ticket,
                    notification_type=notification_type,
                    message=message,
                )

            self.create_activity_log(
                ticket=ticket,
                actor=request.user,
                action=notification_type,
                description=message,
            )

        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["patch"])
    def update_priority(self, request, pk=None):
        ticket = self.get_object()

        if request.user.role not in ["agent", "admin"]:
            return Response(
                {"detail": "Only agents and admins can update priority."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_priority = request.data.get("priority")
        valid_priorities = ["low", "medium", "high", "urgent"]

        if new_priority not in valid_priorities:
            return Response(
                {"detail": "Invalid priority."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_priority = ticket.priority

        if old_priority == new_priority:
            return Response(TicketSerializer(ticket).data)

        with transaction.atomic():
            ticket.priority = new_priority
            ticket.save(update_fields=["priority", "updated_at"])

            message = (
                f"Ticket #{ticket.id} priority changed "
                f"from {old_priority} to {new_priority}."
            )

            recipients = [ticket.customer]

            if ticket.assigned_agent:
                recipients.append(ticket.assigned_agent)

            unique_recipients = {
                recipient.id: recipient for recipient in recipients
            }

            for recipient in unique_recipients.values():
                self.create_notification(
                    recipient=recipient,
                    ticket=ticket,
                    notification_type="priority_changed",
                    message=message,
                )

            self.create_activity_log(
                ticket=ticket,
                actor=request.user,
                action="priority_changed",
                description=message,
            )

        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["patch"])
    def assign_agent(self, request, pk=None):
        ticket = self.get_object()

        if request.user.role != "admin":
            return Response(
                {"detail": "Only admins can assign tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )

        agent_id = request.data.get("agent_id")

        if not agent_id:
            return Response(
                {"detail": "agent_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            agent = User.objects.get(
                id=agent_id,
                role="agent",
            )
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Valid support agent not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        old_agent = ticket.assigned_agent
        old_status = ticket.status

        if old_agent and old_agent.id == agent.id:
            return Response(TicketSerializer(ticket).data)

        with transaction.atomic():
            ticket.assigned_agent = agent

            if ticket.status == "open":
                ticket.status = "assigned"

            ticket.save()

            self.create_notification(
                recipient=agent,
                ticket=ticket,
                notification_type="ticket_assigned",
                message=f"Ticket #{ticket.id} has been assigned to you.",
            )

            if old_agent:
                self.create_notification(
                    recipient=old_agent,
                    ticket=ticket,
                    notification_type="status_changed",
                    message=f"Ticket #{ticket.id} has been reassigned.",
                )

            self.create_activity_log(
                ticket=ticket,
                actor=request.user,
                action="ticket_assigned",
                description=(
                    f"Ticket #{ticket.id} was assigned to "
                    f"{agent.username}. Previous status: {old_status}."
                ),
            )

        return Response(TicketSerializer(ticket).data)