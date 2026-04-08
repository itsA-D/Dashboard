import uuid

from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework.parsers import MultiPartParser, FormParser

from apps.core.views import TenantViewSet
from apps.audit.mixins import AuditMixin
from apps.core.permissions import (
    IsAuthenticated,
    IsManagerOrAbove,
    CanApproveExpense,
    IsOwnerOrFinance,
)
from apps.notifications.tasks import send_approval_notification
from apps.notifications.models import Notification
from apps.approvals.engine import ApprovalEngine

from .models import Expense, ExpensePolicy
from .serializers import (
    ExpenseSerializer,
    ExpenseCreateSerializer,
    ExpensePolicySerializer,
    ReceiptUploadSerializer,
)
from .services import PolicyEngine
from .tasks import process_receipt_ocr


class ExpenseViewSet(AuditMixin, TenantViewSet):
    """
    Expense lifecycle.

    submit:    draft → pending_approval (runs policy engine)
    approve:   pending_approval → approved (with approval engine)
    reject:    pending_approval → rejected
    """

    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def get_permissions(self):
        if self.action in ("submit",):
            return [IsAuthenticated()]
        if self.action in ("approve", "reject"):
            return [IsAuthenticated(), CanApproveExpense()]
        if self.action in ("list",):
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Expense.objects.filter(company=self.request.company)
        role = self.request.user.role

        if role == "employee":
            return qs.filter(user=self.request.user)
        if role == "manager":
            team_ids = self.request.user.reports.values_list("id", flat=True)
            return qs.filter(user_id__in=[*team_ids, self.request.user.id])
        # Finance + Admin see all
        return qs

    def create(self, request, *args, **kwargs):
        # AuditMixin.perform_create handles creation + auditing
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        expense = serializer.save(company=self.request.company, user=self.request.user)

        if expense.receipt_key:
            process_receipt_ocr.delay(str(expense.id), expense.receipt_key)

        # Audit creation
        self._write_audit(
            f"{expense.__class__.__name__.lower()}.created",
            expense,
            before=None,
            after=self._serialize_instance(expense),
        )

    @action(detail=True, methods=["POST"])
    def submit(self, request, pk=None):
        """Submit expense for approval — runs policy engine."""
        expense = self.get_object()

        if expense.status != "draft":
            return Response(
                {"error": {"code": "INVALID_STATUS", "message": "Only draft expenses can be submitted"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Snap before change
        before = self._serialize_instance(expense)

        # Run policy engine
        engine = PolicyEngine(request.company, expense.user)
        is_valid, reason = engine.validate(expense)
        if not is_valid:
            expense.is_policy_flagged = True
            expense.policy_flag_reason = reason
            expense.save(update_fields=["is_policy_flagged", "policy_flag_reason", "updated_at"])
            return Response(
                {
                    "error": {
                        "code": "POLICY_VIOLATION",
                        "message": reason,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        approval_engine = ApprovalEngine(request.company)
        flow = approval_engine.assign_flow(expense)
        if not flow:
            return Response(
                {
                    "error": {
                        "code": "NO_APPROVAL_FLOW",
                        "message": "No active approval flow matches this expense",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense.status = "pending_approval"
        expense.submitted_at = timezone.now()
        expense.current_step = 0
        expense.total_steps = flow.steps.count()
        expense.save()

        # Audit submission
        self._write_audit(
            "expense.submitted",
            expense,
            before=before,
            after=self._serialize_instance(expense),
        )

        # Trigger notification to approvers
        send_approval_notification.delay(str(expense.id))

        Notification.objects.create(
            company=expense.company,
            user=expense.user,
            notification_type="expense.submitted",
            title="Expense submitted",
            body="Your expense has been submitted for approval.",
            action_url=f"/me/expenses/{expense.id}",
            metadata={"expense_id": str(expense.id)},
        )

        serializer = ExpenseSerializer(expense)
        return Response(serializer.data)

    @action(detail=True, methods=["POST"])
    def approve(self, request, pk=None):
        """Approve an expense — single or final step."""
        expense = self.get_object()

        if expense.status not in ("submitted", "pending_approval"):
            return Response(
                {"error": {"code": "INVALID_STATUS", "message": "Cannot approve in current state"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if expense.user == request.user:
            return Response(
                {"error": {"code": "SELF_APPROVAL", "message": "You cannot approve your own expense"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        before = self._serialize_instance(expense)

        approval_engine = ApprovalEngine(request.company)
        result = approval_engine.advance(
            expense=expense,
            actor=request.user,
            action="approved",
            comment=request.data.get("reason", ""),
        )

        if not result.success:
            return Response(
                {"error": {"code": "APPROVAL_FAILED", "message": result.message}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if expense.status == "approved":
            expense.approved_at = timezone.now()
            expense.approved_by = request.user
            expense.save(update_fields=["approved_at", "approved_by", "updated_at"])

            # Audit final approval
            self._write_audit(
                "expense.approved",
                expense,
                before=before,
                after=self._serialize_instance(expense),
            )

            Notification.objects.create(
                company=expense.company,
                user=expense.user,
                notification_type="expense.approved",
                title="Expense approved",
                body="Your expense has been approved.",
                action_url=f"/me/expenses/{expense.id}",
                metadata={"expense_id": str(expense.id)},
            )
        else:
            # Audit step approval
            self._write_audit(
                "expense.step_approved",
                expense,
                before=before,
                after=self._serialize_instance(expense),
            )

        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=["POST"])
    def reject(self, request, pk=None):
        """Reject an expense."""
        expense = self.get_object()

        if expense.status not in ("submitted", "pending_approval"):
            return Response(
                {"error": {"code": "INVALID_STATUS", "message": "Cannot reject in current state"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if expense.user == request.user:
            return Response(
                {"error": {"code": "SELF_APPROVAL", "message": "You cannot reject your own expense"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        before = self._serialize_instance(expense)
        reason = request.data.get("reason", "")
        approval_engine = ApprovalEngine(request.company)
        result = approval_engine.advance(
            expense=expense,
            actor=request.user,
            action="rejected",
            comment=reason,
        )

        if not result.success:
            return Response(
                {"error": {"code": "REJECTION_FAILED", "message": result.message}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Audit rejection
        self._write_audit(
            "expense.rejected",
            expense,
            before=before,
            after=self._serialize_instance(expense),
        )

        Notification.objects.create(
            company=expense.company,
            user=expense.user,
            notification_type="expense.rejected",
            title="Expense rejected",
            body=reason or "Your expense was rejected.",
            action_url=f"/me/expenses/{expense.id}",
            metadata={"expense_id": str(expense.id)},
        )

        return Response(ExpenseSerializer(expense).data)

    @action(detail=False, methods=["POST"])
    def upload_receipt(self, request):
        """Return a presigned S3 PUT URL for direct upload."""
        serializer = ReceiptUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content_type = serializer.validated_data["content_type"]
        allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
        if content_type not in allowed:
            return Response(
                {"error": {"code": "INVALID_FILE_TYPE", "message": "Invalid file type"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense_id = serializer.validated_data.get("expense_id", "")
        key = f"receipts/{request.company_id}/{request.user.id}/{expense_id or uuid.uuid4()}"

        s3 = settings.DEFAULT_FILE_STORAGE
        # For local dev, return a mock URL
        if hasattr(settings, "DEFAULT_FILE_STORAGE") and "FileSystemStorage" in settings.DEFAULT_FILE_STORAGE:
            return Response(
                {
                    "upload_url": f"/media/{key}",
                    "receipt_key": key,
                }
            )

        # Presigned S3 URL
        import boto3
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
        )
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=900,  # 15 minutes
        )
        return Response({"upload_url": presigned_url, "receipt_key": key})


class ExpensePolicyViewSet(AuditMixin, TenantViewSet):
    """Manage expense policies — finance/admin only."""

    serializer_class = ExpensePolicySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManagerOrAbove()]

    def get_queryset(self):
        return ExpensePolicy.objects.filter(company=self.request.company)
