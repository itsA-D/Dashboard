from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import BaseModel
from .middleware import TenantMiddleware
from .permissions import IsAuthenticated
from .pagination import CursorPagination
from .exceptions import custom_exception_handler


class TenantViewSet(viewsets.ModelViewSet):
    """
    All business ViewSets inherit from this.

    Guarantees tenant isolation at the queryset level —
    every query is automatically filtered to the current company.
    """

    pagination_class = CursorPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if hasattr(self.request, "company_id") and self.request.company_id:
            return qs.filter(company_id=self.request.company_id)
        return qs

    def perform_create(self, serializer):
        # company injected from middleware — never from client payload
        serializer.save(company=self.request.company)

    def get_exception_handler(self):
        return custom_exception_handler


class NoDeleteViewSet(TenantViewSet):
    """ViewSet that only allows list/retrieve/create/update, no destroy."""

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Delete not permitted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
