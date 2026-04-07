from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.views import TenantViewSet
from apps.audit.mixins import AuditMixin
from apps.core.permissions import IsAuthenticated, IsManagerOrAbove
from apps.expenses.serializers import ExpenseSerializer

from .models import ApprovalFlow, ApprovalStep
from .serializers import ApprovalFlowSerializer, ApprovalActionSerializer
from .engine import ApprovalEngine


class ApprovalFlowViewSet(AuditMixin, TenantViewSet):
    """Manage approval flows — admin/finance only."""

    serializer_class = ApprovalFlowSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManagerOrAbove()]

    def get_queryset(self):
        return ApprovalFlow.objects.filter(company=self.request.company)


class ApprovalQueueView(APIView):
    """Expenses pending current user's approval."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        engine = ApprovalEngine(request.company)
        pending = engine.get_pending_queue(request.user)
        serializer = ExpenseSerializer(pending, many=True)
        return Response(serializer.data)
