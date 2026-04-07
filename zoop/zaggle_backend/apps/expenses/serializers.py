from rest_framework import serializers
from django.utils import timezone
from decimal import Decimal

from .models import Expense, ExpensePolicy


class ExpenseSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    card_last_four = serializers.CharField(source="card.last_four", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "user",
            "user_name",
            "card",
            "card_last_four",
            "amount",
            "currency",
            "category",
            "description",
            "merchant_name",
            "merchant_mcc",
            "expense_date",
            "receipt_key",
            "ocr_data",
            "status",
            "submitted_at",
            "approved_at",
            "approved_by",
            "approved_by_name",
            "rejection_reason",
            "is_policy_flagged",
            "policy_flag_reason",
            "current_step",
            "total_steps",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "user",
            "status",
            "submitted_at",
            "approved_at",
            "approved_by",
            "is_policy_flagged",
            "policy_flag_reason",
            "current_step",
            "total_steps",
            "created_at",
            "updated_at",
        ]


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "amount",
            "category",
            "description",
            "merchant_name",
            "merchant_mcc",
            "expense_date",
            "receipt_key",
            "card",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        if value > Decimal("500000"):
            raise serializers.ValidationError("Exceeds maximum single-transaction limit")
        return value

    def validate_expense_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Cannot submit future-dated expenses")
        return value


class ExpenseSubmitSerializer(serializers.Serializer):
    """Validated just before submit — checks policy."""

    def validate(self, attrs):
        expense = Expense(**attrs)
        # Policy engine runs in the service layer
        return attrs


class ReceiptUploadSerializer(serializers.Serializer):
    expense_id = serializers.UUIDField(required=False)
    content_type = serializers.CharField()


class ExpensePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpensePolicy
        fields = "__all__"
        read_only_fields = ("id", "company", "created_at", "updated_at")
