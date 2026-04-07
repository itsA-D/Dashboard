from rest_framework import serializers

from .models import ApprovalFlow, ApprovalStep, ApprovalAction


class ApprovalStepSerializer(serializers.ModelSerializer):
    approver_user_name = serializers.CharField(
        source="approver_user.full_name", read_only=True
    )

    class Meta:
        model = ApprovalStep
        fields = [
            "id",
            "flow",
            "order",
            "approver_type",
            "approver_role",
            "approver_user",
            "approver_user_name",
        ]
        read_only_fields = ("id", "created_at", "updated_at")


class ApprovalFlowSerializer(serializers.ModelSerializer):
    steps = ApprovalStepSerializer(many=True, read_only=True)

    class Meta:
        model = ApprovalFlow
        fields = [
            "id",
            "name",
            "amount_min",
            "amount_max",
            "categories",
            "is_active",
            "steps",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "company", "created_at", "updated_at")


class ApprovalActionSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = ApprovalAction
        fields = [
            "id",
            "expense",
            "step",
            "actor",
            "actor_name",
            "action",
            "comment",
            "created_at",
        ]
        read_only_fields = ("id", "created_at")
