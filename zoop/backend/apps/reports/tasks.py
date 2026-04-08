import uuid
from celery import shared_task
from decimal import Decimal


@shared_task(bind=True, max_retries=3, queue="reports")
def generate_report(self, report_id: str, company_id: str, params: dict):
    """
    Generate a CSV report for the given parameters.

    In production this would:
      1. Query expenses with filters
      2. Build CSV rows
      3. Upload to S3
      4. Update report record with download URL
    """
    import csv
    import io
    import os

    from django.conf import settings
    from apps.expenses.models import Expense

    company_id_uuid = uuid.UUID(company_id)
    queryset = Expense.objects.filter(company_id=company_id_uuid)

    status_filter = params.get("status")
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    category_filter = params.get("category")
    if category_filter:
        queryset = queryset.filter(category=category_filter)

    date_from = params.get("date_from")
    if date_from:
        queryset = queryset.filter(expense_date__gte=date_from)

    date_to = params.get("date_to")
    if date_to:
        queryset = queryset.filter(expense_date__lte=date_to)

    # Build CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Employee", "Category", "Amount", "Currency",
        "Merchant", "Date", "Status", "Submitted At",
    ])
    for expense in queryset.order_by("-expense_date"):
        writer.writerow([
            str(expense.id),
            expense.user.full_name,
            expense.get_category_display(),
            str(expense.amount),
            expense.currency,
            expense.merchant_name,
            str(expense.expense_date),
            expense.status,
            str(expense.submitted_at or ""),
        ])

    csv_content = output.getvalue()

    # For local dev, save to media directory
    if hasattr(settings, "DEFAULT_FILE_STORAGE") and "FileSystemStorage" in settings.DEFAULT_FILE_STORAGE:
        media_dir = os.path.join(settings.BASE_DIR, "media", "reports")
        os.makedirs(media_dir, exist_ok=True)
        file_path = os.path.join(media_dir, f"{report_id}.csv")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(csv_content)
        return {"status": "ready", "download_url": f"/media/reports/{report_id}.csv"}

    # Production: upload to S3
    import boto3
    key = f"reports/{company_id}/{report_id}.csv"
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
    )
    s3.put_object(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
        Body=csv_content.encode("utf-8"),
        ContentType="text/csv",
    )
    download_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": key},
        ExpiresIn=3600,
    )
    return {"status": "ready", "download_url": download_url}
