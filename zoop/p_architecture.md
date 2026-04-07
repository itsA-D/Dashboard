# Zoop — System Architecture
## Django Backend + Next.js Frontend

> Corporate spend management: expense management, prepaid card control, CTC restructuring, reimbursements.

---

## 1. Executive Summary

Zoffl is a multi-tenant B2B SaaS platform for Indian corporates. It restructures employee CTC to maximise in-hand salary via tax-exempt expense categories, while giving finance teams full real-time visibility and control over company spend.

**Three user roles drive all product surface:**

| Role | Primary surface | Key actions |
|---|---|---|
| Admin / Finance | Full dashboard | Cards, budgets, reports, settings, audit |
| Manager | Approval queue + team view | Approve/reject, monitor team spend |
| Employee | Self-service panel | Submit expense, check balance, track reimbursement |

**Core design principles:**

- Multi-tenant from day one — every query is scoped to `company_id`
- RBAC enforced at the Django middleware/permission layer, never just the UI
- Immutable audit trail on every state-changing action
- Async-first for OCR, notifications, and report generation (Celery)
- Policy engine is data-driven (stored in DB), not hardcoded business logic
- Django ORM handles all DB access — no raw SQL except for analytics aggregates

---

## 2. Full Tech Stack

### Backend
| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Language | Python | 3.12+ | Backend runtime |
| Framework | Django | 5.x | Core framework, ORM, admin, auth |
| API layer | Django REST Framework (DRF) | 3.15+ | REST endpoints, serializers, viewsets |
| Auth | djangorestframework-simplejwt | 5.x | JWT access + refresh tokens |
| Social/OTP auth | django-allauth | 0.63+ | Google SSO, OTP login |
| Background jobs | Celery | 5.x | Async tasks (OCR, email, reports) |
| Job scheduling | Celery Beat | 5.x | Scheduled jobs (budget alerts, monthly reports) |
| Message broker | Redis | 7.x | Celery broker + result backend |
| Cache | Django cache (Redis backend) | — | API response caching, rate limiting |
| File storage | django-storages + boto3 | — | S3 / Cloudflare R2 receipts |
| OCR | boto3 (AWS Textract) | — | Receipt parsing |
| Email | django-anymail (Resend/SendGrid) | — | Transactional email |
| SMS | Twilio / MSG91 SDK | — | OTP, approval alerts |
| CORS | django-cors-headers | — | Next.js ↔ Django cross-origin |
| Env management | django-environ | — | .env file handling |
| API docs | drf-spectacular | — | Auto-generated OpenAPI 3 schema |
| Validation | DRF serializers + custom validators | — | Request validation |

### Frontend
| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | SSR, routing, RSC |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Components | shadcn/ui | latest | Accessible headless components |
| Server state | TanStack Query | v5 | API data fetching, caching, mutations |
| Client state | Zustand | 4.x | UI state (filters, modals, selections) |
| Forms | React Hook Form + Zod | — | Type-safe form validation |
| Tables | TanStack Table | v8 | Sortable, filterable, virtual rows |
| Charts | Recharts | 2.x | Spend trends, category donuts |
| File upload | react-dropzone | — | Receipt drag-and-drop |
| Dates | date-fns | 3.x | Formatting, calculations |
| HTTP client | Axios + custom hook | — | Calls to Django DRF API |
| Toast | Sonner | — | Action feedback |

### Database
| Layer | Technology | Purpose |
|---|---|---|
| Primary DB | PostgreSQL | 16+ | All application data |
| Cache / broker | Redis | 7+ | Celery, session cache, rate limiting |
| DB hosting | Supabase or Neon | Managed PostgreSQL with connection pooling |

### Infrastructure
| Concern | Choice |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Railway or Render (Docker container) |
| Static + media | Cloudflare R2 or AWS S3 |
| CDN | Cloudflare |
| Secrets | Doppler or Railway env vars |
| Error tracking | Sentry (separate DSNs for Django + Next.js) |
| Product analytics | PostHog |
| Uptime monitoring | BetterUptime or UptimeRobot |

---

## 3. Django Project Structure

```
zoffl_backend/
├── config/                         # Django project config
│   ├── settings/
│   │   ├── base.py                 # Shared settings
│   │   ├── development.py          # Local dev overrides
│   │   └── production.py           # Production overrides
│   ├── urls.py                     # Root URL config
│   ├── wsgi.py
│   └── asgi.py                     # For async views (optional)
│
├── apps/
│   ├── core/                       # Shared utilities
│   │   ├── models.py               # BaseModel with id, created_at, updated_at
│   │   ├── permissions.py          # Custom DRF permission classes
│   │   ├── middleware.py           # Tenant context middleware
│   │   ├── pagination.py           # Cursor pagination
│   │   ├── exceptions.py           # Custom exception handler
│   │   └── utils.py
│   │
│   ├── companies/                  # Multi-tenancy
│   │   ├── models.py               # Company, CompanySettings
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── users/                      # Auth + user management
│   │   ├── models.py               # User (extends AbstractBaseUser)
│   │   ├── serializers.py
│   │   ├── views.py                # Login, OTP, profile
│   │   ├── permissions.py          # IsAdmin, IsFinance, IsManager, IsEmployee
│   │   └── urls.py
│   │
│   ├── expenses/                   # Expense lifecycle
│   │   ├── models.py               # Expense, ExpensePolicy
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py             # Business logic (submit, approve, reject)
│   │   ├── tasks.py                # Celery tasks (OCR trigger)
│   │   └── urls.py
│   │
│   ├── cards/                      # Card management
│   │   ├── models.py               # Card, CardTransaction
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py             # Card ops (issue, freeze, limit change)
│   │   ├── webhooks.py             # Card network webhook handler
│   │   └── urls.py
│   │
│   ├── approvals/                  # Approval flow engine
│   │   ├── models.py               # ApprovalFlow, ApprovalStep, ApprovalAction
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── engine.py               # Flow selection + step progression logic
│   │   └── urls.py
│   │
│   ├── budgets/                    # Budget tracking
│   │   ├── models.py               # Budget, BudgetAlert
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py             # Utilisation calculation
│   │   ├── tasks.py                # Celery: alert checks
│   │   └── urls.py
│   │
│   ├── reports/                    # Export + analytics
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── tasks.py                # Celery: CSV/PDF generation
│   │   ├── generators.py           # Report build logic
│   │   └── urls.py
│   │
│   ├── notifications/              # In-app + email + SMS
│   │   ├── models.py               # Notification
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services.py             # Dispatch logic
│   │   ├── tasks.py                # Celery: async send
│   │   └── urls.py
│   │
│   └── audit/                      # Immutable audit log
│       ├── models.py               # AuditLog (no update/delete)
│       ├── serializers.py
│       ├── views.py
│       ├── mixins.py               # AuditMixin for views
│       └── urls.py
│
├── celery_app.py                   # Celery app config
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── Dockerfile
├── docker-compose.yml              # Local dev: Django + PostgreSQL + Redis
└── .env.example
```

---

## 4. Database Schema (PostgreSQL + Django ORM)

### BaseModel (abstract)
All models inherit from this:

```python
# apps/core/models.py
import uuid
from django.db import models

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

---

### Company

```python
class Company(BaseModel):
    name = models.CharField(max_length=255)
    gst_number = models.CharField(max_length=15, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)
    plan = models.CharField(
        max_length=20,
        choices=[('starter','Starter'),('growth','Growth'),('enterprise','Enterprise')],
        default='starter'
    )
    is_active = models.BooleanField(default=True)
    logo_url = models.URLField(blank=True)

    def __str__(self):
        return self.name
```

---

### User

```python
class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('finance', 'Finance'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='users')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.CharField(max_length=100, blank=True)
    employee_code = models.CharField(max_length=50, blank=True)
    manager = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='reports'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        unique_together = [('company', 'employee_code')]
        indexes = [
            models.Index(fields=['company', 'role']),
            models.Index(fields=['company', 'department']),
        ]
```

---

### Card

```python
class Card(BaseModel):
    CARD_TYPE_CHOICES = [('prepaid','Prepaid'),('virtual','Virtual'),('physical','Physical')]
    NETWORK_CHOICES = [('visa','Visa'),('mastercard','Mastercard'),('rupay','RuPay')]
    STATUS_CHOICES = [
        ('pending','Pending'),('active','Active'),
        ('frozen','Frozen'),('blocked','Blocked'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='cards')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cards')
    last_four = models.CharField(max_length=4)          # Only last 4 — full PAN in card vault
    card_type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES)
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    monthly_limit = models.DecimalField(max_digits=12, decimal_places=2)
    daily_limit = models.DecimalField(max_digits=12, decimal_places=2)
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    issued_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    external_card_id = models.CharField(max_length=255, blank=True)  # Card network reference

    class Meta:
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['user']),
        ]
```

---

### Expense

```python
class Expense(BaseModel):
    CATEGORY_CHOICES = [
        ('travel','Travel'),('meals','Meals & Entertainment'),
        ('fuel','Fuel'),('accommodation','Accommodation'),
        ('medical','Medical'),('telecom','Telecom'),('other','Other'),
    ]
    STATUS_CHOICES = [
        ('draft','Draft'),('submitted','Submitted'),
        ('pending_approval','Pending Approval'),('approved','Approved'),
        ('rejected','Rejected'),('reimbursed','Reimbursed'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    card = models.ForeignKey(Card, null=True, blank=True, on_delete=models.SET_NULL)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, max_length=500)
    merchant_name = models.CharField(max_length=255, blank=True)
    merchant_mcc = models.CharField(max_length=10, blank=True)
    expense_date = models.DateField()
    receipt_key = models.CharField(max_length=500, blank=True)  # S3 object key
    ocr_data = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_expenses'
    )
    rejection_reason = models.TextField(blank=True)
    is_policy_flagged = models.BooleanField(default=False)
    policy_flag_reason = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'user']),
            models.Index(fields=['company', 'expense_date']),
            models.Index(fields=['card']),
        ]
```

---

### ApprovalFlow + ApprovalStep

```python
class ApprovalFlow(BaseModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    amount_min = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_max = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )  # null = no upper limit
    categories = models.JSONField(default=list)  # [] = all categories
    is_active = models.BooleanField(default=True)

class ApprovalStep(BaseModel):
    APPROVER_TYPE = [
        ('manager','Direct Manager'),
        ('role','Role-based'),      # e.g., any Finance user
        ('user','Specific User'),
        ('auto','Auto-approve'),
    ]
    flow = models.ForeignKey(ApprovalFlow, on_delete=models.CASCADE, related_name='steps')
    order = models.PositiveSmallIntegerField()
    approver_type = models.CharField(max_length=20, choices=APPROVER_TYPE)
    approver_role = models.CharField(max_length=20, blank=True)
    approver_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['order']

class ApprovalAction(BaseModel):
    ACTION_CHOICES = [('approved','Approved'),('rejected','Rejected'),('info_requested','Info Requested')]
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='approval_actions')
    step = models.ForeignKey(ApprovalStep, on_delete=models.CASCADE)
    actor = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    comment = models.TextField(blank=True)
```

---

### Budget

```python
class Budget(BaseModel):
    PERIOD_CHOICES = [('monthly','Monthly'),('quarterly','Quarterly'),('annual','Annual')]

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)
    category = models.CharField(max_length=30, blank=True)  # blank = all categories
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='monthly')
    period_start = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    alert_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=80.00)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        indexes = [models.Index(fields=['company', 'department', 'period_start'])]
```

---

### ExpensePolicy

```python
class ExpensePolicy(BaseModel):
    POLICY_TYPE = [
        ('amount_limit','Per-transaction amount limit'),
        ('receipt_required','Receipt required above amount'),
        ('category_block','Category blocked for role'),
        ('duplicate_check','Duplicate detection window'),
        ('weekend_block','Block weekend submissions'),
        ('auto_approve','Auto-approve rule'),
    ]
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    policy_type = models.CharField(max_length=30, choices=POLICY_TYPE)
    applies_to_role = models.CharField(max_length=20, blank=True)  # blank = all roles
    applies_to_category = models.CharField(max_length=30, blank=True)  # blank = all categories
    value = models.JSONField()      # Flexible: {"amount": 5000}, {"hours": 24}, {"enabled": true}
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
```

---

### AuditLog (append-only)

```python
class AuditLog(models.Model):
    # Intentionally does NOT extend BaseModel — no updated_at
    # No update or delete ever permitted on this table
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=100)       # e.g. "expense.approved"
    entity_type = models.CharField(max_length=50)   # e.g. "expense"
    entity_id = models.UUIDField()
    before_state = models.JSONField(default=dict)
    after_state = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'created_at']),
            models.Index(fields=['company', 'entity_type', 'entity_id']),
            models.Index(fields=['actor']),
        ]
        # No permissions for update/delete — enforced at DB level
```

---

### Notification

```python
class Notification(BaseModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50)   # e.g. "expense.approval_needed"
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        indexes = [models.Index(fields=['user', 'is_read', 'created_at'])]
```

---

## 5. API Design (DRF)

### URL structure

```
/api/v1/
├── auth/
│   ├── login/                     POST — email + OTP request
│   ├── verify-otp/                POST — verify OTP, returns tokens
│   ├── token/refresh/             POST — rotate refresh token
│   ├── logout/                    POST — invalidate refresh token
│   └── me/                        GET/PATCH — current user profile
│
├── companies/
│   ├── {id}/                      GET/PATCH — company detail
│   └── {id}/settings/             GET/PATCH — company settings
│
├── users/
│   ├── /                          GET (list), POST (create)
│   └── {id}/                      GET, PATCH, DELETE (deactivate)
│
├── expenses/
│   ├── /                          GET (list with filters), POST (create)
│   ├── {id}/                      GET, PATCH
│   ├── {id}/submit/               POST — submit for approval
│   ├── {id}/approve/              POST — approve (manager/finance)
│   ├── {id}/reject/               POST — reject with reason
│   └── upload-receipt/            POST — get presigned S3 URL
│
├── cards/
│   ├── /                          GET (list), POST (issue)
│   ├── {id}/                      GET
│   ├── {id}/freeze/               POST
│   ├── {id}/unfreeze/             POST
│   ├── {id}/block/                POST
│   ├── {id}/update-limit/         POST
│   └── {id}/transactions/         GET
│
├── approvals/
│   ├── queue/                     GET — pending approvals for current user
│   ├── flows/                     GET, POST
│   └── flows/{id}/                GET, PATCH, DELETE
│
├── budgets/
│   ├── /                          GET, POST
│   ├── {id}/                      GET, PATCH, DELETE
│   └── utilisation/               GET — current period utilisation per dept
│
├── reports/
│   ├── generate/                  POST — trigger async report generation
│   ├── {id}/download/             GET — download when ready
│   └── analytics/dashboard/       GET — KPI aggregates for dashboard
│
├── notifications/
│   ├── /                          GET (list)
│   ├── {id}/read/                 POST
│   └── read-all/                  POST
│
├── audit/
│   └── /                          GET (admin/finance only)
│
└── webhooks/
    └── cards/                     POST — card network callbacks (HMAC verified)
```

### Standard response envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "next_cursor": "...",
      "has_more": true,
      "count": 47
    }
  }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "POLICY_VIOLATION",
    "message": "Expense exceeds your per-transaction limit of ₹5,000 for Travel",
    "field": "amount"
  }
}
```

---

## 6. Celery Task Architecture

```python
# celery_app.py
from celery import Celery
app = Celery('zoffl')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### Task inventory

| Task | Queue | Trigger | Timeout |
|---|---|---|---|
| `process_receipt_ocr` | `ocr` | Expense created with receipt | 60s |
| `send_approval_notification` | `notifications` | Expense submitted | 30s |
| `send_email` | `email` | Any notification event | 30s |
| `send_sms` | `sms` | OTP, card transaction | 15s |
| `generate_report` | `reports` | Report requested | 300s |
| `check_budget_alerts` | `periodic` | Every 30 min (Celery Beat) | 60s |
| `process_card_webhook` | `webhooks` | Webhook received | 30s |
| `archive_audit_logs` | `periodic` | Daily (Celery Beat) | 600s |

### OCR task example

```python
# apps/expenses/tasks.py
from celery import shared_task
import boto3

@shared_task(bind=True, max_retries=3, queue='ocr')
def process_receipt_ocr(self, expense_id: str, s3_key: str):
    try:
        textract = boto3.client('textract')
        response = textract.analyze_document(
            Document={'S3Object': {'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': s3_key}},
            FeatureTypes=['FORMS']
        )
        ocr_data = extract_expense_fields(response)  # amount, date, merchant, GST
        Expense.objects.filter(id=expense_id).update(ocr_data=ocr_data)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
```

---

## 7. Core Execution Flows

### Expense submission

```
1. Employee uploads receipt
   → POST /api/v1/expenses/upload-receipt/
   → Django returns presigned S3 PUT URL (15 min expiry)
   → Client uploads directly to S3

2. Client confirms upload + creates expense
   → POST /api/v1/expenses/ with { receipt_key, amount (estimated), category }
   → Expense created with status=draft
   → process_receipt_ocr.delay(expense_id, s3_key) — Celery task

3. OCR completes (async, ~10s)
   → expense.ocr_data updated with extracted fields
   → Frontend polls GET /api/v1/expenses/{id}/ until ocr_data populated

4. Employee reviews pre-filled form → POST /api/v1/expenses/{id}/submit/
   → ExpenseService.submit(expense) runs policy engine:
      - Amount within limit for category + role?
      - Receipt attached for amounts > ₹500?
      - Duplicate within 24h window?
   → If policy blocks: status stays draft, policy_flag_reason set
   → If passes: status = pending_approval
   → ApprovalEngine.assign_flow(expense) selects matching ApprovalFlow
   → send_approval_notification.delay(expense_id, approver_id)

5. Approver receives notification → POST /api/v1/expenses/{id}/approve/
   → ApprovalEngine.advance(expense, actor, action)
   → If multi-step: next step approver notified
   → If final step approved: status = approved, payout job enqueued
   → Expense owner notified of outcome
```

### Card transaction webhook

```
1. Card network POSTs to /api/v1/webhooks/cards/
2. Django verifies HMAC-SHA256 signature
3. process_card_webhook.delay(payload)
4. Celery worker:
   - Creates Expense with status=submitted, source=card_transaction
   - Updates card.available_balance
   - Checks budget utilisation — if > threshold, notify finance admin
   - Notifies employee of transaction
```

---

## 8. Multi-Tenancy Implementation

### Middleware (sets company context on every request)

```python
# apps/core/middleware.py
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.company = request.user.company
            request.company_id = request.user.company_id
        return self.get_response(request)
```

### Base ViewSet (all business viewsets inherit from this)

```python
# apps/core/views.py
class TenantViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # All queries automatically filtered to current company
        return super().get_queryset().filter(company=self.request.company)

    def perform_create(self, serializer):
        # company injected from request — never from client payload
        serializer.save(company=self.request.company)
```

---

## 9. Settings Configuration

### config/settings/base.py (key sections)

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_celery_beat',
    'drf_spectacular',
    # Zoffl apps
    'apps.core',
    'apps.companies',
    'apps.users',
    'apps.expenses',
    'apps.cards',
    'apps.approvals',
    'apps.budgets',
    'apps.reports',
    'apps.notifications',
    'apps.audit',
]

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.CursorPagination',
    'PAGE_SIZE': 50,
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_TASK_ROUTES = {
    'apps.expenses.tasks.*': {'queue': 'ocr'},
    'apps.notifications.tasks.*': {'queue': 'notifications'},
    'apps.reports.tasks.*': {'queue': 'reports'},
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL'),
    }
}
```

---

## 10. Module Responsibility Map

| Django App | Models | Key responsibility |
|---|---|---|
| `core` | BaseModel | Shared mixins, permissions, middleware, pagination |
| `companies` | Company | Tenant management, settings |
| `users` | User | Auth, RBAC, offboarding |
| `expenses` | Expense, ExpensePolicy | Full expense lifecycle, policy engine |
| `cards` | Card, CardTransaction | Card ops, webhook ingestion |
| `approvals` | ApprovalFlow, ApprovalStep, ApprovalAction | Flow engine, multi-step logic |
| `budgets` | Budget, BudgetAlert | Allocation, utilisation, alerts |
| `reports` | — | Async CSV/PDF generation |
| `notifications` | Notification | In-app, email, SMS dispatch |
| `audit` | AuditLog | Append-only audit trail |

---

> **Core rule:** `company_id` is always injected from the authenticated user's JWT claim via `TenantMiddleware`. It is never read from a request body, query param, or URL segment. A query that leaks data across tenants is a P0 incident.
