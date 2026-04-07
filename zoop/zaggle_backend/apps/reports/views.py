import uuid
import os

from django.conf import settings
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from apps.core.permissions import IsAuthenticated, IsFinanceOrAbove
from apps.expenses.models import Expense
from apps.users.models import User
from apps.cards.models import Card
from .tasks import generate_report


class ReportGenerateView(APIView):
    """Trigger async report generation — finance/admin only."""

    permission_classes = [IsAuthenticated, IsFinanceOrAbove]

    def post(self, request):
        params = request.data or {}
        report_id = str(uuid.uuid4())

        # Trigger Celery task
        generate_report.delay(report_id, str(request.company_id), params)

        return Response(
            {"report_id": report_id, "status": "generating"},
            status=status.HTTP_202_ACCEPTED,
        )


class ReportDownloadView(APIView):
    """Download a generated report."""

    permission_classes = [IsAuthenticated, IsFinanceOrAbove]

    def get(self, request, pk):
        report_id = str(pk)

        # In dev, look for file in media/reports/
        if hasattr(settings, "DEFAULT_FILE_STORAGE") and "FileSystemStorage" in settings.DEFAULT_FILE_STORAGE:
            file_path = os.path.join(settings.BASE_DIR, "media", "reports", f"{report_id}.csv")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                return Response(
                    {"status": "ready", "content": content},
                    content_type="text/csv",
                )

        return Response(
            {"status": "not_found"},
            status=status.HTTP_404_NOT_FOUND,
        )


class DashboardAnalyticsView(APIView):
    """
    KPI aggregates for the admin dashboard.
    """

    permission_classes = [IsAuthenticated, IsFinanceOrAbove]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        company_id = request.company_id

        # Total spend MTD
        total_spend_mtd = (
            Expense.objects.filter(
                company_id=company_id,
                expense_date__gte=month_start,
                status="approved",
            ).aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )

        # Active employees
        active_employees = User.objects.filter(
            company_id=company_id, is_active=True
        ).count()

        # Pending approvals
        pending_approvals = Expense.objects.filter(
            company_id=company_id,
            status__in=["submitted", "pending_approval"],
        ).count()

        # Cards issued
        cards_issued = Card.objects.filter(company_id=company_id).count()

        # Spend by category (MTD)
        category_breakdown = (
            Expense.objects.filter(
                company_id=company_id,
                expense_date__gte=month_start,
                status="approved",
            )
            .values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )

        # Monthly trend (last 6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            month = month_start - timedelta(days=30 * i)
            next_month = month + timedelta(days=30)
            total = (
                Expense.objects.filter(
                    company_id=company_id,
                    expense_date__gte=month,
                    expense_date__lt=next_month,
                    status="approved",
                ).aggregate(total=Sum("amount"))["total"]
                or Decimal("0")
            )
            monthly_trend.append({
                "month": month.strftime("%Y-%m"),
                "total": total,
            })

        return Response({
            "success": True,
            "data": {
                "total_spend_mtd": total_spend_mtd,
                "active_employees": active_employees,
                "pending_approvals": pending_approvals,
                "cards_issued": cards_issued,
                "category_breakdown": list(category_breakdown),
                "monthly_trend": monthly_trend,
            }
        })
