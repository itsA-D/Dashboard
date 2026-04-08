from apps.core.models import BaseModel
from django.db import models
from apps.companies.models import Company
from apps.users.models import User


class Budget(BaseModel):
    PERIOD_CHOICES = [
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annual", "Annual"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="budgets"
    )
    department = models.CharField(max_length=100)
    category = models.CharField(max_length=30, blank=True)  # blank = all categories
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default="monthly")
    period_start = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    alert_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=80.00
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        indexes = [
            models.Index(fields=["company", "department", "period_start"]),
        ]

    def __str__(self):
        return f"{self.department} — {self.period} — {self.amount}"


class BudgetAlert(BaseModel):
    """Tracks which budget alerts have been sent."""

    ALERT_TYPE_CHOICES = [
        ("threshold_reached", "Threshold Reached"),
        ("exceeded", "Budget Exceeded"),
    ]

    budget = models.ForeignKey(
        Budget, on_delete=models.CASCADE, related_name="alerts"
    )
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    is_sent = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["budget", "is_sent"]),
        ]
