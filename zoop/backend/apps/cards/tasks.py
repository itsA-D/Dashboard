from celery import shared_task
from decimal import Decimal


@shared_task(bind=True, max_retries=3, queue="webhooks")
def process_card_webhook(self, payload: dict):
    """
    Process a card network webhook payload.

    Expected payload shape:
    {
        "event_type": "transaction" | "card_status",
        "external_card_id": "...",
        "amount": 1234.56,
        "merchant_name": "...",
        ...
    }
    """
    try:
        from apps.cards.models import Card, CardTransaction
        from apps.expenses.models import Expense
        from django.utils import timezone

        external_card_id = payload.get("external_card_id")
        event_type = payload.get("event_type")

        try:
            card = Card.objects.get(external_card_id=external_card_id)
        except Card.DoesNotExist:
            return {"error": "Card not found"}

        if event_type == "transaction":
            # Create expense from card transaction
            existing = CardTransaction.objects.filter(
                external_id=payload.get("external_id")
            ).exists()
            if existing:
                return {"status": "duplicate"}

            txn = CardTransaction.objects.create(
                card=card,
                external_id=payload.get("external_id"),
                transaction_type="debit",
                amount=payload.get("amount"),
                currency=payload.get("currency", "INR"),
                merchant_name=payload.get("merchant_name", ""),
                merchant_mcc=payload.get("mcc", ""),
                transaction_at=payload.get("transaction_at", timezone.now()),
                description=payload.get("description", ""),
            )

            # Update card balance
            card.available_balance = max(
                card.available_balance - Decimal(str(payload.get("amount", 0))), 0
            )
            card.save()

            # Create draft expense for the transaction
            Expense.objects.create(
                company=card.company,
                user=card.user,
                card=card,
                amount=payload.get("amount"),
                category="other",
                merchant_name=payload.get("merchant_name", ""),
                merchant_mcc=payload.get("mcc", ""),
                expense_date=timezone.now().date(),
                status="draft",
                description=payload.get("description", ""),
            )

        elif event_type == "card_status":
            new_status = payload.get("status")
            if new_status in ("active", "frozen", "blocked"):
                card.status = new_status
                card.save()

        return {"status": "processed"}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
