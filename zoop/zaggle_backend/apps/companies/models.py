from apps.core.models import BaseModel
from django.db import models


class Company(BaseModel):
    PLAN_CHOICES = [
        ("starter", "Starter"),
        ("growth", "Growth"),
        ("enterprise", "Enterprise"),
    ]

    name = models.CharField(max_length=255)
    gst_number = models.CharField(max_length=15, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="starter")
    is_active = models.BooleanField(default=True)
    logo_url = models.URLField(blank=True)

    def __str__(self):
        return self.name


class CompanySettings(BaseModel):
    company = models.OneToOneField(
        Company, on_delete=models.CASCADE, related_name="settings"
    )
    reimbursement_bank_account = models.CharField(max_length=50, blank=True)
    reimbursement_ifsc = models.CharField(max_length=11, blank=True)
    default_currency = models.CharField(max_length=3, default="INR")
    expense_submission_window_days = models.PositiveIntegerField(default=30)

    def __str__(self):
        return f"Settings for {self.company.name}"
