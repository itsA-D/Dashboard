from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import TenantViewSet
from apps.audit.mixins import AuditMixin
from apps.core.permissions import IsCompanyAdmin, IsFinanceOrAbove

from .models import Company, CompanySettings
from .serializers import CompanySerializer, CompanyDetailSerializer, CompanySettingsSerializer


class CompanyViewSet(AuditMixin, TenantViewSet):
    """Company detail and settings — admin only."""

    serializer_class = CompanySerializer
    permission_classes = [IsCompanyAdmin]

    def get_queryset(self):
        return Company.objects.filter(id=self.request.company_id)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CompanyDetailSerializer
        return CompanySerializer

    @action(detail=False, methods=["GET", "PATCH"])
    def settings(self, request):
        settings_obj, _ = CompanySettings.objects.get_or_create(
            company=request.company
        )
        if request.method == "PATCH":
            before = self._serialize_instance(settings_obj)
            serializer = CompanySettingsSerializer(
                settings_obj, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            settings_saved = serializer.save()

            # Audit settings update
            self._write_audit(
                "company.settings_updated",
                settings_saved,
                before=before,
                after=self._serialize_instance(settings_saved),
            )

            return Response(serializer.data)
        serializer = CompanySettingsSerializer(settings_obj)
        return Response(serializer.data)
