import json

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.permissions import IsFinanceOrAbove
from apps.core.views import TenantViewSet

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(TenantViewSet, ReadOnlyModelViewSet):
    """
    Audit log — finance/admin only, read-only.

    AuditMixin should be added to ViewSets to auto-write these records.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsFinanceOrAbove]

    def get_queryset(self):
        qs = super().get_queryset()
        entity_type = self.request.query_params.get("entity_type")
        entity_id = self.request.query_params.get("entity_id")
        actor_id = self.request.query_params.get("actor_id")

        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        return qs.order_by("-created_at")
