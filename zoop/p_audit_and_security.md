# Zoop — Security, Audit & Defensive Design
## Django Backend Implementation

> Every finance platform is a target. This document defines security posture, RBAC, audit design, and Django-specific defensive defaults.

---

## 1. Executive Summary

Zoffl processes company money, employee financial records, and prepaid card credentials. The threat model covers external attackers, compromised employee accounts, and insider fraud (e.g., a manager approving their own expense).

**Defensive priorities (in order):**

1. Tenant isolation — no company ever sees another's data
2. RBAC — enforced at the DRF permission layer, not the frontend
3. Immutable audit trail — every state-changing action logged; no delete permitted
4. Least privilege — each service account, API key, and role has minimum necessary access
5. Fail closed — when policy is ambiguous, deny and log

---

## 2. Authentication System

### Login flow (OTP-based, no passwords)

```
1. POST /api/v1/auth/login/  { "email": "..." }
   → Generate 6-digit OTP, store in Redis with 10-min TTL
   → Send OTP via email (or SMS if phone provided)
   → Return { "session_token": "..." }  — opaque, 10-min TTL

2. POST /api/v1/auth/verify-otp/  { "session_token": "...", "otp": "..." }
   → Validate OTP from Redis
   → If valid: delete OTP from Redis (single-use)
   → Return { "access": "<JWT>", "refresh": "<JWT>" }

3. All subsequent requests: Authorization: Bearer <access_token>

4. POST /api/v1/auth/token/refresh/  { "refresh": "..." }
   → If valid and not blacklisted: return new access + new refresh
   → Old refresh token added to JWT blacklist (simplejwt built-in)
```

### JWT claims structure

```json
{
  "user_id": "uuid",
  "company_id": "uuid",
  "role": "finance",
  "email": "user@company.com",
  "exp": 1712345678,
  "iat": 1712344778,
  "jti": "unique-token-id"
}
```

`company_id` and `role` are embedded in the JWT. The middleware extracts them — they are never read from request data.

### OTP Redis key design

```
otp:{session_token}  →  { "otp": "483921", "email": "...", "attempts": 0 }
TTL: 600 seconds
Max attempts: 5 (after 5 failures, session_token invalidated)
```

### Token blacklist on logout

```python
# apps/users/views.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()  # simplejwt blacklist app
            return Response({'success': True})
        except TokenError:
            return Response({'success': False}, status=400)
```

---

## 3. RBAC System

### Role hierarchy

```
admin > finance > manager > employee
```

Each role is additive — higher roles include all lower-role permissions.

### DRF Permission Classes

```python
# apps/core/permissions.py
from rest_framework.permissions import BasePermission

class IsCompanyAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsFinanceOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('admin', 'finance')

class IsManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('admin', 'finance', 'manager')

class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class CanApproveExpense(BasePermission):
    """Prevents self-approval — a user cannot approve their own expense."""
    def has_object_permission(self, request, view, obj):
        return (
            request.user.role in ('admin', 'finance', 'manager')
            and obj.user != request.user  # Self-approval blocked
        )

class IsOwnerOrFinance(BasePermission):
    """Employee can access own records; finance/admin can access all."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'finance'):
            return True
        return obj.user == request.user
```

### Applying permissions to ViewSets

```python
# apps/expenses/views.py
class ExpenseViewSet(TenantViewSet):
    serializer_class = ExpenseSerializer

    def get_permissions(self):
        if self.action in ('approve', 'reject'):
            return [IsAuthenticated(), CanApproveExpense()]
        if self.action in ('list',):
            return [IsAuthenticated(), IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Expense.objects.filter(company=self.request.company)
        role = self.request.user.role
        # Employees only see their own expenses
        if role == 'employee':
            qs = qs.filter(user=self.request.user)
        # Managers see their team
        elif role == 'manager':
            team_ids = self.request.user.reports.values_list('id', flat=True)
            qs = qs.filter(user_id__in=[*team_ids, self.request.user.id])
        # Finance + Admin see everything (already filtered by company)
        return qs
```

### Permission matrix (summary)

| Action | Employee | Manager | Finance | Admin |
|---|---|---|---|---|
| Submit own expense | ✅ | ✅ | ✅ | ✅ |
| View own expenses | ✅ | ✅ | ✅ | ✅ |
| View team expenses | ❌ | ✅ (team only) | ✅ all | ✅ all |
| Approve expense | ❌ | ✅ (not own) | ✅ (not own) | ✅ (not own) |
| Reject expense | ❌ | ✅ (not own) | ✅ | ✅ |
| View own card | ✅ | ✅ | ✅ | ✅ |
| Freeze/block card | ❌ | ❌ | ✅ | ✅ |
| Issue card | ❌ | ❌ | ✅ | ✅ |
| Set/edit budget | ❌ | ❌ | ✅ | ✅ |
| Add/deactivate user | ❌ | ❌ | ❌ | ✅ |
| Change user role | ❌ | ❌ | ❌ | ✅ |
| Export reports | ❌ | ❌ | ✅ | ✅ |
| View audit log | ❌ | ❌ | ✅ | ✅ |
| Manage policies | ❌ | ❌ | ✅ | ✅ |

---

## 4. Tenant Isolation

### Middleware injection

```python
# apps/core/middleware.py
class TenantMiddleware:
    """
    Injects company context from authenticated user.
    company_id is NEVER read from request data.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.company = None
        request.company_id = None
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.company = request.user.company
            request.company_id = str(request.user.company_id)
        return self.get_response(request)
```

### Base ViewSet filters all queries by company

```python
# apps/core/views.py
class TenantViewSet(viewsets.ModelViewSet):
    """
    All business ViewSets must inherit from this.
    Guarantees tenant isolation at the queryset level.
    """
    def get_queryset(self):
        return super().get_queryset().filter(company_id=self.request.company_id)

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.company,
            # Do NOT accept company from serializer input — it is stripped here
        )
```

### Serializer company field protection

```python
# In all serializers that have a company field:
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('id', 'company', 'created_at', 'updated_at')
        # company is always read_only — it comes from middleware, never from client
```

### What must never happen

- `company_id` accepted from request body, query params, or URL segment
- Cross-company joins (e.g., `Expense.objects.filter(user__company_id=X)` from a request with company Y)
- Shared Redis keys without company prefix — always `company:{id}:{key}`

---

## 5. Audit Log Implementation

### Design: append-only table

```python
# apps/audit/models.py
class AuditLog(models.Model):
    # No update_at — this model is never updated
    # DB-level: REVOKE UPDATE, DELETE ON audit_auditlog FROM app_role
    ...
```

### AuditMixin for ViewSets

```python
# apps/audit/mixins.py
from apps.audit.models import AuditLog
import json

class AuditMixin:
    """
    Add to any ViewSet to get automatic audit logging
    on create, update, partial_update, destroy.
    """
    audit_actions = {
        'create': '{model}.created',
        'update': '{model}.updated',
        'partial_update': '{model}.updated',
        'destroy': '{model}.deleted',
    }

    def _write_audit(self, action, instance, before=None, after=None):
        model_name = instance.__class__.__name__.lower()
        AuditLog.objects.create(
            company=self.request.company,
            actor=self.request.user,
            action=action.format(model=model_name),
            entity_type=model_name,
            entity_id=instance.id,
            before_state=before or {},
            after_state=after or {},
            ip_address=self._get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')[:500],
        )

    def perform_update(self, serializer):
        before = self._serialize_instance(serializer.instance)
        instance = serializer.save()
        after = self._serialize_instance(instance)
        self._write_audit(
            f'{instance.__class__.__name__.lower()}.updated',
            instance, before, after
        )

    def _get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return self.request.META.get('REMOTE_ADDR')

    def _serialize_instance(self, instance):
        # Serialize to dict for before/after snapshots
        # Exclude sensitive fields
        EXCLUDED = {'password', 'otp', 'card_number'}
        data = {}
        for field in instance._meta.fields:
            if field.name not in EXCLUDED:
                data[field.name] = str(getattr(instance, field.name, ''))
        return data
```

### Audit log action naming convention

```
{entity}.{verb}

Examples:
  expense.submitted
  expense.approved
  expense.rejected
  card.issued
  card.frozen
  card.blocked
  card.limit_changed
  user.created
  user.deactivated
  user.role_changed
  budget.created
  budget.limit_exceeded
  policy.updated
  report.exported
```

---

## 6. Expense Policy Engine

The policy engine runs before an expense can transition from `draft` → `submitted`. It evaluates all active `ExpensePolicy` records for the company.

```python
# apps/expenses/services.py
class PolicyEngine:
    def __init__(self, company, user):
        self.company = company
        self.user = user
        self.policies = ExpensePolicy.objects.filter(
            company=company, is_active=True
        )

    def validate(self, expense) -> tuple[bool, str]:
        """Returns (is_valid, reason_if_invalid)"""
        for policy in self.policies:
            result = self._check(policy, expense)
            if not result.is_valid:
                return False, result.reason
        return True, ''

    def _check(self, policy, expense):
        # Skip policy if it targets a different role/category
        if policy.applies_to_role and policy.applies_to_role != self.user.role:
            return PolicyResult(True)
        if policy.applies_to_category and policy.applies_to_category != expense.category:
            return PolicyResult(True)

        if policy.policy_type == 'amount_limit':
            limit = policy.value.get('amount', 0)
            if expense.amount > limit:
                return PolicyResult(False, f'Exceeds limit of ₹{limit:,.0f} for {expense.category}')

        elif policy.policy_type == 'receipt_required':
            threshold = policy.value.get('amount', 500)
            if expense.amount >= threshold and not expense.receipt_key:
                return PolicyResult(False, f'Receipt required for expenses above ₹{threshold:,.0f}')

        elif policy.policy_type == 'duplicate_check':
            hours = policy.value.get('hours', 24)
            cutoff = timezone.now() - timedelta(hours=hours)
            duplicate_exists = Expense.objects.filter(
                company=self.company,
                user=self.user,
                amount=expense.amount,
                merchant_name=expense.merchant_name,
                created_at__gte=cutoff,
            ).exclude(id=expense.id).exists()
            if duplicate_exists:
                return PolicyResult(False, 'Possible duplicate expense detected within 24 hours')

        elif policy.policy_type == 'weekend_block':
            if policy.value.get('enabled') and expense.expense_date.weekday() >= 5:
                return PolicyResult(False, 'Expense submissions on weekends are not allowed')

        return PolicyResult(True)
```

---

## 7. Card Security

### What is stored vs what is not

| Field | Stored in Zoffl DB? | Where it lives |
|---|---|---|
| Last 4 digits | ✅ (for display) | `cards.last_four` |
| Full card PAN | ❌ | Card network vault (HDFC/Axis/NSDL) |
| CVV | ❌ | Never stored anywhere |
| Expiry | ✅ (date only) | `cards.expires_at` |
| Card network reference ID | ✅ (for API calls) | `cards.external_card_id` |

### Webhook HMAC verification

```python
# apps/cards/webhooks.py
import hmac, hashlib

class CardWebhookView(APIView):
    authentication_classes = []  # Webhooks use HMAC, not JWT
    permission_classes = []

    def post(self, request):
        signature = request.headers.get('X-Card-Network-Signature', '')
        secret = settings.CARD_NETWORK_WEBHOOK_SECRET.encode()
        payload = request.body

        expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, f'sha256={expected}'):
            return Response({'error': 'Invalid signature'}, status=400)

        # Enqueue for async processing — never process inline
        process_card_webhook.delay(request.data)
        return Response({'received': True})
```

---

## 8. File Upload Security

### Presigned URL flow

```python
# apps/expenses/views.py
class ReceiptUploadView(APIView):
    def post(self, request):
        expense_id = request.data.get('expense_id')
        content_type = request.data.get('content_type')

        # Validate content type
        allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if content_type not in allowed:
            return Response({'error': 'Invalid file type'}, status=400)

        # Construct private, non-guessable S3 key
        key = f"receipts/{request.company_id}/{request.user.id}/{expense_id}/{uuid.uuid4()}"

        s3 = boto3.client('s3')
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': key,
                'ContentType': content_type,
                'ContentLength': 10 * 1024 * 1024,  # 10 MB max
            },
            ExpiresIn=900  # 15 minutes
        )
        return Response({'upload_url': presigned_url, 'receipt_key': key})
```

### Serving receipts (never public)

```python
class ReceiptDownloadView(APIView):
    def get(self, request, expense_id):
        expense = get_object_or_404(
            Expense, id=expense_id, company=request.company
        )
        # IsOwnerOrFinance permission applied at view level
        s3 = boto3.client('s3')
        signed_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': expense.receipt_key},
            ExpiresIn=3600  # 1 hour — for viewing only
        )
        return Response({'url': signed_url})
```

---

## 9. Rate Limiting

```python
# apps/core/throttles.py
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class OTPRequestThrottle(AnonRateThrottle):
    rate = '5/10min'  # 5 OTP requests per 10 min per IP

class OTPVerifyThrottle(AnonRateThrottle):
    rate = '10/10min'

class ExpenseSubmitThrottle(UserRateThrottle):
    rate = '20/min'

class ReportExportThrottle(UserRateThrottle):
    rate = '5/5min'

class StandardUserThrottle(UserRateThrottle):
    rate = '120/min'
```

Apply per view:
```python
class OTPRequestView(APIView):
    throttle_classes = [OTPRequestThrottle]
    ...
```

---

## 10. Django Security Settings

```python
# config/settings/production.py

# HTTPS enforcement
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# CORS — only allow the frontend origin
CORS_ALLOWED_ORIGINS = [
    'https://app.zoffl.in',
]
CORS_ALLOW_CREDENTIALS = True

# No Django admin in production (separate internal tool)
# Remove 'django.contrib.admin' from INSTALLED_APPS in production
# or restrict to internal IP via middleware

# Secret key — never hardcoded
SECRET_KEY = env('DJANGO_SECRET_KEY')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 60,  # Connection pooling
        'OPTIONS': {
            'sslmode': 'require',  # Always TLS to DB
        }
    }
}

# Logging — structured JSON for production
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
        'sentry': {'class': 'sentry_sdk.integrations.logging.EventHandler'},
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
    'loggers': {
        'django.security': {'handlers': ['sentry'], 'level': 'ERROR'},
        'zoffl': {'handlers': ['console'], 'level': 'INFO'},
    }
}
```

---

## 11. Error Handling

### Custom exception handler

```python
# apps/core/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    AuthenticationFailed, NotAuthenticated, PermissionDenied, ValidationError
)

ERROR_CODES = {
    'AuthenticationFailed': 'AUTH_FAILED',
    'NotAuthenticated': 'NOT_AUTHENTICATED',
    'PermissionDenied': 'FORBIDDEN',
    'NotFound': 'NOT_FOUND',
    'ValidationError': 'VALIDATION_ERROR',
    'Throttled': 'RATE_LIMITED',
}

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        error_code = ERROR_CODES.get(exc.__class__.__name__, 'ERROR')
        response.data = {
            'success': False,
            'error': {
                'code': error_code,
                'message': str(exc.detail) if hasattr(exc, 'detail') else str(exc),
            }
        }
    return response

# Custom business exceptions
class PolicyViolationError(Exception):
    pass

class DuplicateExpenseError(Exception):
    pass

class CardOperationError(Exception):
    pass
```

---

## 12. Defensive Checklist

- [ ] `TenantMiddleware` listed before auth middleware in `MIDDLEWARE` setting
- [ ] All business ViewSets inherit from `TenantViewSet`
- [ ] `company` field is `read_only` in all serializers
- [ ] `CanApproveExpense` permission prevents self-approval on every approval action
- [ ] `AuditMixin` applied to all ViewSets touching expenses, cards, users, budgets
- [ ] `AuditLog` model has no update/delete at DB level (`REVOKE UPDATE, DELETE`)
- [ ] Card PAN never stored — only `last_four` and `external_card_id`
- [ ] Webhook endpoints use HMAC verification, not JWT auth
- [ ] Presigned S3 URLs expire in 15 min; GET URLs expire in 1 hour
- [ ] `PolicyEngine.validate()` runs before every `expense.submit()` transition
- [ ] Rate limiting applied on all auth + mutation endpoints
- [ ] `SECURE_SSL_REDIRECT`, `HSTS`, and `CORS_ALLOWED_ORIGINS` set in production
- [ ] `SECRET_KEY` and all credentials loaded from environment, never hardcoded
- [ ] All 5xx errors shipped to Sentry with full Django context
- [ ] User offboarding flow: deactivate → blacklist all refresh tokens → freeze cards → flag pending expenses

---

> **Core principle:** The Django permission layer is the security boundary — not the frontend, not the serializer, not the URL. Every sensitive action validates role and ownership in the `get_permissions()` method before any business logic runs.
