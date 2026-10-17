
from rest_framework import generics
from rest_framework.permissions import AllowAny

from .serializers import CustomerRegistrationSerializer


class CustomerRegistrationView(generics.CreateAPIView):
    serializer_class = CustomerRegistrationSerializer
    permission_classes = [AllowAny]