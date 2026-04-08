from apps.core.models import BaseModel
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """Custom user model with company and role."""

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("finance", "Finance"),
        ("manager", "Manager"),
        ("employee", "Employee"),
    ]

    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="users"
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="employee")
    department = models.CharField(max_length=100, blank=True)
    employee_code = models.CharField(max_length=50, blank=True)
    manager = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reports",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        unique_together = [("company", "employee_code")]
        indexes = [
            models.Index(fields=["company", "role"]),
            models.Index(fields=["company", "department"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.email})"
