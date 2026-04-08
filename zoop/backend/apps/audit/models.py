import uuid

from django.db import models

from apps.companies.models import Company
from apps.users.models import User


class AuditLog(models.Model):
    """
    Immutable audit trail — no updated_at field, no updates or deletes permitted.

    To enforce at DB level, run after migrations:
        REVOKE UPDATE, DELETE ON audit_auditlog FROM app_role;
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="audit_logs"
    )
    actor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    action = models.CharField(max_length=100)  # e.g. "expense.approved"
    entity_type = models.CharField(max_length=50)  # e.g. "expense"
    entity_id = models.UUIDField()
    before_state = models.JSONField(default=dict)
    after_state = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["company", "created_at"]),
            models.Index(fields=["company", "entity_type", "entity_id"]),
            models.Index(fields=["actor"]),
        ]

    def __str__(self):
        return f"{self.actor} — {self.action} — {self.entity_type}"
