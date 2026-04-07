from rest_framework import serializers

from .models import Card, CardTransaction


class CardSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Card
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "last_four",
            "card_type",
            "network",
            "status",
            "monthly_limit",
            "daily_limit",
            "available_balance",
            "issued_at",
            "expires_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "company", "created_at", "updated_at")


class CardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = [
            "user",
            "last_four",
            "card_type",
            "network",
            "monthly_limit",
            "daily_limit",
            "expires_at",
            "external_card_id",
        ]


class CardTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardTransaction
        fields = [
            "id",
            "card",
            "external_id",
            "transaction_type",
            "amount",
            "currency",
            "merchant_name",
            "merchant_mcc",
            "transaction_at",
            "description",
            "created_at",
        ]
        read_only_fields = ("id", "created_at")
