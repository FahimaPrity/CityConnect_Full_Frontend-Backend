from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import SLA
from .serializers import SLASerializer


class SLAListView(generics.ListAPIView):

    serializer_class = SLASerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "customer":
            slas = SLA.objects.filter(
                ticket__customer=user
            )

        elif user.role == "agent":
            slas = SLA.objects.filter(
                ticket__assigned_agent=user
            )

        elif user.role == "admin":
            slas = SLA.objects.all()

        else:
            slas = SLA.objects.none()

        # Check SLA breach status
        for sla in slas:
            sla.check_breach()

        return slas