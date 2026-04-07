import json

from apps.audit.models import AuditLog


class AuditMixin:
    """
    Add to any ViewSet to get automatic audit logging.

    Example usage in a ViewSet:
        class ExpenseViewSet(AuditMixin, TenantViewSet):
            ...

    The mixin overrides perform_create/update/destroy to write
    before/after snapshots to AuditLog.
    """

    audit_actions = {
        "create": "{model}.created",
        "update": "{model}.updated",
        "partial_update": "{model}.updated",
        "destroy": "{model}.deleted",
    }

    def _write_audit(self, action, instance, before=None, after=None):
        model_name = instance.__class__.__name__.lower()
        AuditLog.objects.create(
            company=self.request.company,
            actor=self.request.user,
            action=action.format(model=model_name),
            entity_type=model_name,
            entity_id=instance.id,
            before_state=before or {},
            after_state=after or {},
            ip_address=self._get_client_ip(),
            user_agent=self.request.META.get("HTTP_USER_AGENT", "")[:500],
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._write_audit(
            f"{instance.__class__.__name__.lower()}.created",
            instance,
            before=None,
            after=self._serialize_instance(instance),
        )
        return instance

    def perform_update(self, serializer):
        before = self._serialize_instance(serializer.instance)
        instance = serializer.save()
        after = self._serialize_instance(instance)
        self._write_audit(
            f"{instance.__class__.__name__.lower()}.updated",
            instance,
            before,
            after,
        )
        return instance

    def perform_destroy(self, instance):
        self._write_audit(
            f"{instance.__class__.__name__.lower()}.deleted",
            instance,
            before=self._serialize_instance(instance),
            after=None,
        )
        instance.delete()

    def _get_client_ip(self):
        x_forwarded_for = self.request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return self.request.META.get("REMOTE_ADDR")

    def _serialize_instance(self, instance):
        """Serialize model fields to dict — exclude sensitive fields."""
        EXCLUDED = {"password", "otp", "card_number", "refresh_token"}
        data = {}
        for field in instance._meta.fields:
            if field.name not in EXCLUDED:
                data[field.name] = str(getattr(instance, field.name, ""))
        return data
