from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from django.utils import timezone
from django.db.models import QuerySet

from .models import Expense, ExpensePolicy


@dataclass
class PolicyResult:
    is_valid: bool
    reason: str = ""


class PolicyEngine:
    """
    Evaluates all active ExpensePolicy records for a company
    before an expense transitions from draft -> submitted.
    """

    def __init__(self, company, user):
        self.company = company
        self.user = user
        self.policies: QuerySet[ExpensePolicy] = ExpensePolicy.objects.filter(
            company=company, is_active=True
        )

    def validate(self, expense) -> tuple[bool, str]:
        """Returns (is_valid, reason_if_invalid)."""
        for policy in self.policies:
            result = self._check(policy, expense)
            if not result.is_valid:
                return False, result.reason
        return True, ""

    def _check(self, policy: ExpensePolicy, expense: Expense) -> PolicyResult:
        # Skip if policy targets a different role
        if policy.applies_to_role and policy.applies_to_role != self.user.role:
            return PolicyResult(True)

        # Skip if policy targets a different category
        if policy.applies_to_category and policy.applies_to_category != expense.category:
            return PolicyResult(True)

        value = policy.value or {}

        if policy.policy_type == "amount_limit":
            limit = Decimal(str(value.get("amount", 0)))
            if expense.amount > limit:
                return PolicyResult(
                    False,
                    f"Exceeds limit of ₹{limit:,.0f} for {expense.get_category_display()}",
                )

        elif policy.policy_type == "receipt_required":
            threshold = Decimal(str(value.get("amount", 500)))
            if expense.amount >= threshold and not expense.receipt_key:
                return PolicyResult(
                    False,
                    f"Receipt required for expenses above ₹{threshold:,.0f}",
                )

        elif policy.policy_type == "duplicate_check":
            hours = value.get("hours", 24)
            cutoff = timezone.now() - timezone.timedelta(hours=hours)
            duplicate_exists = (
                Expense.objects.filter(
                    company=self.company,
                    user=self.user,
                    amount=expense.amount,
                    merchant_name=expense.merchant_name,
                    created_at__gte=cutoff,
                )
                .exclude(id=expense.id if expense.id else None)
                .exists()
            )
            if duplicate_exists:
                return PolicyResult(False, "Possible duplicate expense detected")

        elif policy.policy_type == "weekend_block":
            if value.get("enabled") and expense.expense_date.weekday() >= 5:
                return PolicyResult(False, "Expense submissions on weekends are not allowed")

        elif policy.policy_type == "category_block":
            blocked_roles = value.get("blocked_roles", [])
            if self.user.role in blocked_roles:
                return PolicyResult(
                    False,
                    f"Category '{expense.get_category_display()}' is not allowed for your role",
                )

        return PolicyResult(True)

    def flag_expense(self, expense) -> tuple[bool, str]:
        """
        Run policies and set flag without blocking.
        Used when expense is submitted but with a warning.
        """
        is_valid, reason = self.validate(expense)
        if not is_valid:
            expense.is_policy_flagged = True
            expense.policy_flag_reason = reason
        return is_valid, reason
