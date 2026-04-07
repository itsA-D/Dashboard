from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_name",
            "action",
            "entity_type",
            "entity_id",
            "before_state",
            "after_state",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields
