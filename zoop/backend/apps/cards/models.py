from apps.core.models import BaseModel
from django.db import models
from apps.companies.models import Company
from apps.users.models import User


class Card(BaseModel):
    """Prepaid company card — full PAN is stored in the card network vault."""

    CARD_TYPE_CHOICES = [
        ("prepaid", "Prepaid"),
        ("virtual", "Virtual"),
        ("physical", "Physical"),
    ]
    NETWORK_CHOICES = [
        ("visa", "Visa"),
        ("mastercard", "Mastercard"),
        ("rupay", "RuPay"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("frozen", "Frozen"),
        ("blocked", "Blocked"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="cards"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="cards"
    )
    last_four = models.CharField(max_length=4)
    card_type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES)
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    monthly_limit = models.DecimalField(max_digits=12, decimal_places=2)
    daily_limit = models.DecimalField(max_digits=12, decimal_places=2)
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    issued_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    external_card_id = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"****{self.last_four} — {self.user.email}"


class CardTransaction(BaseModel):
    """Transaction record from card network webhook."""

    TRANSACTION_TYPE_CHOICES = [
        ("debit", "Debit"),
        ("credit", "Credit"),
    ]

    card = models.ForeignKey(
        Card, on_delete=models.CASCADE, related_name="transactions"
    )
    external_id = models.CharField(max_length=255, unique=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    merchant_name = models.CharField(max_length=255, blank=True)
    merchant_mcc = models.CharField(max_length=10, blank=True)
    transaction_at = models.DateTimeField()
    description = models.TextField(blank=True)
    created_at_txn = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["card", "transaction_at"]),
            models.Index(fields=["external_id"]),
        ]

    def __str__(self):
        return f"{self.transaction_type} {self.amount} on {self.card}"
