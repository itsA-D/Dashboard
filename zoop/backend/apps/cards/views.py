import hmac
import hashlib

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.views import TenantViewSet
from apps.audit.mixins import AuditMixin
from apps.core.permissions import IsAuthenticated, IsFinanceOrAbove

from .models import Card, CardTransaction
from .serializers import (
    CardSerializer,
    CardCreateSerializer,
    CardTransactionSerializer,
)
from .tasks import process_card_webhook


class CardViewSet(AuditMixin, TenantViewSet):
    """Card management — finance/admin can issue and manage."""

    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return CardCreateSerializer
        return CardSerializer

    def get_permissions(self):
        if self.action in ("create", "freeze", "unfreeze", "block", "update_limit"):
            return [IsAuthenticated(), IsFinanceOrAbove()]
        if self.action == "transactions":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = CardCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        card = serializer.save(company=request.company)
        card.status = "active"
        card.issued_at = timezone.now()
        card.save()

        # Audit card issuance
        self._write_audit(
            "card.issued",
            card,
            before=None,
            after=self._serialize_instance(card),
        )

        return Response(CardSerializer(card).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _assert_can_modify(card, action):
        if card.status == "blocked":
            raise ValueError(f"Cannot {action} a blocked card")

    @action(detail=True, methods=["POST"])
    def freeze(self, request, pk=None):
        card = self.get_object()
        try:
            self._assert_can_modify(card, "freeze")
        except ValueError as e:
            return Response(
                {"error": {"code": "INVALID_OPERATION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        before = self._serialize_instance(card)
        card.status = "frozen"
        card.save()

        # Audit freeze
        self._write_audit(
            "card.frozen",
            card,
            before=before,
            after=self._serialize_instance(card),
        )

        return Response(CardSerializer(card).data)

    @action(detail=True, methods=["POST"])
    def unfreeze(self, request, pk=None):
        card = self.get_object()
        if card.status != "frozen":
            return Response(
                {"error": {"code": "INVALID_OPERATION", "message": "Card is not frozen"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        before = self._serialize_instance(card)
        card.status = "active"
        card.save()

        # Audit unfreeze
        self._write_audit(
            "card.unfrozen",
            card,
            before=before,
            after=self._serialize_instance(card),
        )

        return Response(CardSerializer(card).data)

    @action(detail=True, methods=["POST"])
    def block(self, request, pk=None):
        card = self.get_object()
        before = self._serialize_instance(card)
        card.status = "blocked"
        card.save()

        # Audit block
        self._write_audit(
            "card.blocked",
            card,
            before=before,
            after=self._serialize_instance(card),
        )

        return Response(CardSerializer(card).data)

    @action(detail=True, methods=["POST"])
    def update_limit(self, request, pk=None):
        card = self.get_object()
        before = self._serialize_instance(card)
        monthly_limit = request.data.get("monthly_limit")
        daily_limit = request.data.get("daily_limit")
        if monthly_limit is not None:
            card.monthly_limit = monthly_limit
        if daily_limit is not None:
            card.daily_limit = daily_limit
        card.save()

        # Audit limit update
        self._write_audit(
            "card.limit_updated",
            card,
            before=before,
            after=self._serialize_instance(card),
        )

        return Response(CardSerializer(card).data)

    @action(detail=True, methods=["GET"])
    def transactions(self, request, pk=None):
        card = self.get_object()
        transactions_qs = card.transactions.order_by("-transaction_at")
        page = self.paginate_queryset(transactions_qs, request)
        if page is not None:
            serializer = CardTransactionSerializer(page, many=True)
            return self.get_paginated_response(
                serializer.data,
                count=transactions_qs.count(),
            )
        serializer = CardTransactionSerializer(transactions_qs, many=True)
        return Response(serializer.data)

class CardWebhookView(APIView):
    """
    Webhook endpoint for card network events (e.g., HDFC/Axis/NSDL).

    Verified via HMAC-SHA256 — no JWT auth.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        signature = request.headers.get("X-Card-Network-Signature", "")
        secret = settings.CARD_NETWORK_WEBHOOK_SECRET.encode()
        payload = request.body

        expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, f"sha256={expected}"):
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        process_card_webhook.delay(request.data)
        return Response({"received": True})
