from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.views import TenantViewSet
from apps.audit.mixins import AuditMixin
from apps.core.permissions import IsAuthenticated, IsFinanceOrAbove
from apps.expenses.models import Expense

from .models import Budget
from .serializers import (
    BudgetSerializer,
    BudgetCreateSerializer,
    UtilisationSerializer,
)


class BudgetViewSet(AuditMixin, TenantViewSet):
    """Budget management — finance/admin only for write."""

    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return BudgetCreateSerializer
        return BudgetSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsFinanceOrAbove()]

    def create(self, request, *args, **kwargs):
        serializer = BudgetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        budget = serializer.save(company=request.company, created_by=request.user)

        # Audit budget creation
        self._write_audit(
            "budget.created",
            budget,
            before=None,
            after=self._serialize_instance(budget),
        )

        return Response(BudgetSerializer(budget).data, status=status.HTTP_201_CREATED)


class UtilisationView(APIView):
    """Current period utilisation per department/category."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        budgets = Budget.objects.filter(company=request.company)
        result = []

        for budget in budgets:
            # Calculate period range
            period_start = budget.period_start
            if budget.period == "quarterly":
                period_end = period_start + timedelta(days=90)
            elif budget.period == "annual":
                period_end = period_start + timedelta(days=365)
            else:
                period_end = period_start + timedelta(days=30)

            now = timezone.now().date()
            effective_end = min(period_end, now)

            qs = Expense.objects.filter(
                company=request.company,
                expense_date__gte=period_start,
                expense_date__lte=effective_end,
                status="approved",
            )
            if budget.category:
                qs = qs.filter(category=budget.category)
            if budget.department:
                qs = qs.filter(user__department=budget.department)

            total_spent = qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
            remaining = budget.amount - total_spent
            utilisation_pct = (
                (total_spent / budget.amount * 100) if budget.amount > 0 else Decimal("0")
            )

            if utilisation_pct >= 90:
                status_label = "critical"
            elif utilisation_pct >= budget.alert_threshold:
                status_label = "warning"
            else:
                status_label = "normal"

            result.append(
                {
                    "department": budget.department,
                    "category": budget.category,
                    "period": budget.period,
                    "budget_amount": budget.amount,
                    "spent": total_spent,
                    "remaining": remaining,
                    "utilisation_pct": round(utilisation_pct, 2),
                    "status": status_label,
                }
            )

        serializer = UtilisationSerializer(result, many=True)
        return Response({"success": True, "data": serializer.data})
