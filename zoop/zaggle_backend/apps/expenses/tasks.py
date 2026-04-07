from celery import shared_task
import boto3


@shared_task(bind=True, max_retries=3, queue="ocr")
def process_receipt_ocr(self, expense_id: str, s3_key: str):
    """
    Mock OCR task — in production, integrate AWS Textract.
    """
    try:
        # In production: call AWS Textract
        # textract = boto3.client("textract", ...)
        # response = textract.analyze_document(
        #     Document={"S3Object": {"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": s3_key}},
        #     FeatureTypes=["FORMS"]
        # )
        # ocr_data = extract_expense_fields(response)

        # Dev: simulate OCR with a small delay and mock data
        mock_ocr_data = {
            "amount": 0,
            "merchant_name": "",
            "expense_date": "",
            "gst_number": "",
        }

        from apps.expenses.models import Expense
        Expense.objects.filter(id=expense_id).update(ocr_data=mock_ocr_data)

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
