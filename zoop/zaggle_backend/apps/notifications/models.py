from apps.core.models import BaseModel
from django.db import models
from apps.companies.models import Company
from apps.users.models import User


class Notification(BaseModel):
    NOTIFICATION_TYPE_CHOICES = [
        ("expense.approval_needed", "Approval Needed"),
        ("expense.approved", "Expense Approved"),
        ("expense.rejected", "Expense Rejected"),
        ("card.limit_alert", "Card Limit Alert"),
        ("budget.threshold_reached", "Budget Threshold Reached"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="notifications"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_read", "created_at"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.user.email}"
