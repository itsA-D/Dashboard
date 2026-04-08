from apps.core.models import BaseModel
from django.db import models
from apps.companies.models import Company
from apps.users.models import User
from apps.expenses.models import Expense


class ApprovalFlow(BaseModel):
    """Defines approval routing rules based on amount and category."""

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="approval_flows"
    )
    name = models.CharField(max_length=255)
    amount_min = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_max = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    categories = models.JSONField(default=list)  # [] = all categories
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} — {self.company.name}"

    class Meta:
        indexes = [
            models.Index(fields=["company", "is_active"]),
        ]


class ApprovalStep(BaseModel):
    """A single step in an approval flow."""

    APPROVER_TYPE_CHOICES = [
        ("manager", "Direct Manager"),
        ("role", "Role-based"),
        ("user", "Specific User"),
        ("auto", "Auto-approve"),
    ]

    flow = models.ForeignKey(
        ApprovalFlow, on_delete=models.CASCADE, related_name="steps"
    )
    order = models.PositiveSmallIntegerField()
    approver_type = models.CharField(max_length=20, choices=APPROVER_TYPE_CHOICES)
    approver_role = models.CharField(max_length=20, blank=True)
    approver_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        ordering = ["order"]
        indexes = [
            models.Index(fields=["flow", "order"]),
        ]


class ApprovalAction(BaseModel):
    """Audit trail for each approval decision."""

    ACTION_CHOICES = [
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("info_requested", "Info Requested"),
    ]

    expense = models.ForeignKey(
        Expense, on_delete=models.CASCADE, related_name="approval_actions"
    )
    step = models.ForeignKey(
        ApprovalStep, on_delete=models.CASCADE, related_name="actions"
    )
    actor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="approval_actions"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    comment = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["expense", "actor"]),
        ]
