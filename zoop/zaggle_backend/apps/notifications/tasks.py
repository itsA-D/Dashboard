from celery import shared_task


@shared_task(bind=True, max_retries=3, queue="notifications")
def send_approval_notification(self, expense_id: str):
    """Notify approvers that an expense needs their attention."""
    from apps.notifications.models import Notification
    from apps.expenses.models import Expense
    from apps.users.models import User

    try:
        expense = Expense.objects.get(id=expense_id)
    except Expense.DoesNotExist:
        return {"error": "Expense not found"}

    # Find eligible approvers (manager/finance/admin)
    approvers = User.objects.filter(
        company=expense.company,
        role__in=["manager", "finance", "admin"],
        is_active=True,
    ).exclude(id=expense.user_id)

    created = []
    for approver in approvers:
        n = Notification.objects.create(
            company=expense.company,
            user=approver,
            notification_type="expense.approval_needed",
            title="Expense awaiting approval",
            body=f"₹{expense.amount} expense from {expense.user.full_name} needs your review.",
            action_url=f"/approvals/",
            metadata={"expense_id": str(expense.id)},
        )
        created.append(str(n.id))

    return {"notifications_created": created}


@shared_task(bind=True, max_retries=3, queue="notifications")
def send_card_alert(self, card_id: str, alert_type: str, message: str):
    """Send a card-related alert to the card owner."""
    from apps.notifications.models import Notification
    from apps.cards.models import Card

    try:
        card = Card.objects.get(id=card_id)
    except Card.DoesNotExist:
        return {"error": "Card not found"}

    Notification.objects.create(
        company=card.company,
        user=card.user,
        notification_type=f"card.{alert_type}",
        title=f"Card Alert: {alert_type}",
        body=message,
        action_url=f"/me/card/",
        metadata={"card_id": str(card.id)},
    )
    return {"sent": True}


@shared_task(bind=True, max_retries=3, queue="email")
def send_email(self, to_email: str, subject: str, body: str):
    """Send a transactional email."""
    from django.conf import settings
    from django.core.mail import send_mail

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.EMAIL_FROM,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return {"sent": True, "to": to_email}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3, queue="sms")
def send_sms(self, to_phone: str, message: str):
    """Send an SMS notification."""
    from django.conf import settings

    if not settings.TWILIO_ACCOUNT_SID:
        return {"sent": False, "reason": "Twilio not configured"}

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM_NUMBER,
            to=to_phone,
        )
        return {"sent": True, "to": to_phone}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
