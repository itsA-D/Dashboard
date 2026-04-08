from celery import shared_task


@shared_task(bind=True, max_retries=3, queue="periodic")
def check_budget_alerts(self):
    """
    Check all active budgets for threshold breaches and send alerts.
    Runs every 30 minutes via Celery Beat.
    """
    from apps.budgets.models import Budget, BudgetAlert
    from apps.expenses.models import Expense
    from django.utils import timezone
    from datetime import timedelta

    alerts_sent = []

    for budget in Budget.objects.filter(company__is_active=True):
        # Calculate period date range
        period_start = budget.period_start
        if budget.period == "quarterly":
            period_end = period_start + timedelta(days=90)
        elif budget.period == "annual":
            period_end = period_start + timedelta(days=365)
        else:
            period_end = period_start + timedelta(days=30)

        now = timezone.now().date()
        if now > period_end:
            continue  # Past period, skip

        # Sum approved expenses for this budget's scope
        qs = Expense.objects.filter(
            company=budget.company,
            expense_date__gte=period_start,
            expense_date__lte=period_end,
            status="approved",
        )
        if budget.category:
            qs = qs.filter(category=budget.category)

        total_spent = sum(e.amount for e in qs)
        utilisation = (total_spent / budget.amount * 100) if budget.amount > 0 else 0

        # Check threshold
        if utilisation >= budget.alert_threshold:
            already_alerted = BudgetAlert.objects.filter(
                budget=budget,
                alert_type="threshold_reached",
                percentage__gte=budget.alert_threshold,
                is_sent=True,
            ).exists()

            if not already_alerted:
                BudgetAlert.objects.create(
                    budget=budget,
                    alert_type="threshold_reached",
                    percentage=utilisation,
                    is_sent=True,
                )
                alerts_sent.append(str(budget.id))

    return {"alerts_sent": alerts_sent}
