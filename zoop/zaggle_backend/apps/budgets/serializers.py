from rest_framework import serializers

from .models import Budget, BudgetAlert


class BudgetSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = Budget
        fields = [
            "id",
            "department",
            "category",
            "period",
            "period_start",
            "amount",
            "alert_threshold",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "company", "created_at", "updated_at")


class BudgetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = [
            "department",
            "category",
            "period",
            "period_start",
            "amount",
            "alert_threshold",
        ]


class UtilisationSerializer(serializers.Serializer):
    department = serializers.CharField()
    category = serializers.CharField()
    period = serializers.CharField()
    budget_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    spent = serializers.DecimalField(max_digits=14, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=14, decimal_places=2)
    utilisation_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    status = serializers.CharField()  # normal / warning / critical
