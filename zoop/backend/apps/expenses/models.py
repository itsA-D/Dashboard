import uuid

from django.db import models

from apps.core.models import BaseModel
from apps.companies.models import Company
from apps.users.models import User
from apps.cards.models import Card


class Expense(BaseModel):
    """Employee expense record."""

    CATEGORY_CHOICES = [
        ("travel", "Travel"),
        ("meals", "Meals & Entertainment"),
        ("fuel", "Fuel"),
        ("accommodation", "Accommodation"),
        ("medical", "Medical"),
        ("telecom", "Telecom"),
        ("other", "Other"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("pending_approval", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("reimbursed", "Reimbursed"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="expenses"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="expenses"
    )
    card = models.ForeignKey(
        Card, null=True, blank=True, on_delete=models.SET_NULL
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, max_length=500)
    merchant_name = models.CharField(max_length=255, blank=True)
    merchant_mcc = models.CharField(max_length=10, blank=True)
    expense_date = models.DateField()
    receipt_key = models.CharField(max_length=500, blank=True)
    ocr_data = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="draft")
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="approved_expenses"
    )
    rejection_reason = models.TextField(blank=True)
    is_policy_flagged = models.BooleanField(default=False)
    policy_flag_reason = models.TextField(blank=True)
    current_step = models.PositiveSmallIntegerField(default=0)
    total_steps = models.PositiveSmallIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "user"]),
            models.Index(fields=["company", "expense_date"]),
            models.Index(fields=["card"]),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.amount} {self.category}"


class ExpensePolicy(BaseModel):
    """Policy rules evaluated on expense submission."""

    POLICY_TYPES = [
        ("amount_limit", "Per-transaction amount limit"),
        ("receipt_required", "Receipt required above amount"),
        ("category_block", "Category blocked for role"),
        ("duplicate_check", "Duplicate detection window"),
        ("weekend_block", "Block weekend submissions"),
        ("auto_approve", "Auto-approve rule"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="expense_policies"
    )
    policy_type = models.CharField(max_length=30, choices=POLICY_TYPES)
    applies_to_role = models.CharField(max_length=20, blank=True)
    applies_to_category = models.CharField(max_length=30, blank=True)
    value = models.JSONField()  # Flexible: {"amount": 5000}, {"hours": 24}
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.policy_type} — {self.company.name}"

    class Meta:
        indexes = [
            models.Index(fields=["company", "is_active"]),
        ]
