
from django.contrib.auth import get_user_model

from rest_framework import serializers


User = get_user_model()


class CustomerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(
            **validated_data,
            role="customer",
        )
        user.set_password(password)
        user.save()

        return user