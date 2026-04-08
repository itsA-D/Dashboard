# Zoop (Zoop Dashboard)

Corporate spend management platform for Indian companies, with multi-tenant Django APIs and a role-based Next.js dashboard.

This repository contains:
- backend: Django + DRF + Celery backend
- frontend: Next.js 14 frontend
- Architecture and product docs in the root md files

## Table of Contents

1. Project Overview
2. Core Features
3. Architecture
4. Tech Stack
5. Repository Layout
6. Local Setup
7. Environment Variables
8. Running the System
9. API Surface
10. Security and Tenant Isolation
11. Async Jobs and Queues
12. Frontend Behavior and UX Notes
13. Troubleshooting
14. Useful Commands
15. Deployment Notes
16. Known Gaps and Next Priorities

## 1) Project Overview

Zoop is a multi-tenant B2B SaaS platform where each request is scoped to a company context and users operate by role:
- Admin or Finance: full operational controls (cards, budgets, reports, audit)
- Manager: team approval queue and spend visibility
- Employee: self-service expense submission and tracking

The product combines:
- Spend control (budgets, cards, approvals)
- Expense lifecycle management (draft, submit, approve or reject)
- Auditability (immutable event records)
- Operational automation (OCR, notifications, report generation via Celery)

## 2) Core Features

### Backend
- OTP based authentication with JWT access and refresh
- Role based access control at API layer
- Tenant-scoped query model via middleware plus tenant viewsets
- Expense lifecycle with policy checks and approval flow engine
- Card operations and HMAC-verified webhook ingestion
- Budget CRUD and utilisation tracking
- Report generation endpoints and dashboard analytics
- Notification center and read state APIs
- Append-only audit log model and read APIs

### Frontend
- Next.js app router with role-specific dashboard shells
- TanStack Query data layer and Axios auth interceptors
- Expense submission flow with receipt upload support
- Approval queue and expense detail actions
- Cards, budgets, reports, notifications, and audit screens
- Responsive employee experience with mobile-first surfaces

## 3) Architecture

### Backend architecture
- Django app-per-domain structure under backend/apps
- DRF viewsets and APIView endpoints under api/v1
- Celery app configured in celery_app.py with queue routing in settings
- Development defaults use SQLite and local file storage
- Production settings use PostgreSQL, TLS DB connections, secure cookies, HTTPS enforcement

### Frontend architecture
- App router sections:
  - app/(auth): login and OTP verification
  - app/(dashboard): protected product routes
- Data and domain logic:
  - hooks for query and mutation wrappers
  - lib/api for endpoint clients
  - types and schemas for model-safe frontend behavior

## 4) Tech Stack

### Backend
- Python 3.12+
- Django 5.x
- Django REST Framework
- SimpleJWT
- Celery + django-celery-beat
- Redis
- PostgreSQL (prod), SQLite (dev default)
- boto3 + django-storages
- drf-spectacular
- django-cors-headers
- sentry-sdk

### Frontend
- Next.js 14
- React 18
- TypeScript 5
- Tailwind CSS
- TanStack Query v5
- Axios
- React Hook Form + Zod
- Zustand
- Recharts

## 5) Repository Layout

- backend
  - config/settings: base, development, production settings
  - apps/core: middleware, permissions, exceptions, pagination, tenant view base
  - apps/companies: company model and settings
  - apps/users: auth and user management
  - apps/expenses: expense models, views, policy service, OCR tasks
  - apps/cards: card APIs, transaction logic, webhook endpoint and task
  - apps/approvals: flow models, queue endpoint, engine
  - apps/budgets: budget CRUD and utilisation
  - apps/reports: analytics and report generation
  - apps/notifications: notification APIs and tasks
  - apps/audit: immutable audit model and API
  
- frontend
  - app: route groups for auth and dashboard
  - components: domain UI components
  - hooks: query and mutation hooks
  - lib/api: API client modules
  - lib/providers: auth and query context providers
  - types: TypeScript type definitions
  - schemas: Zod validation schemas
  - stores: Zustand state stores
- p_architecture.md, p_audit_and_security.md, p_ui_ux.md
  - product and implementation reference docs

## 6) Local Setup

## Prerequisites
- Python 3.12+
- Node.js 18+
- npm 9+
- Optional for full local stack: Docker Desktop

## Option A: Docker-first backend setup

1. Open terminal in backend
2. Start backend infra and workers:

```powershell
cd backend
docker compose up --build
```

This starts:
- django on port 8000
- postgres on port 5432
- redis on port 6379
- celery worker
- celery beat

3. In another terminal, run migrations:

```powershell
cd backend
docker compose exec django python manage.py migrate
```

## Option B: Non-Docker backend setup

1. Create and activate virtual environment

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend dependencies

```powershell
pip install -r requirements\base.txt
pip install -r requirements\development.txt
```

3. Create env file

```powershell
copy .env.example .env
```

4. Run migrations and server

```powershell
python manage.py migrate
python manage.py runserver
```

5. Optional: run celery and beat locally

```powershell
celery -A celery_app worker -l INFO -Q ocr,notifications,email,sms,reports,webhooks,periodic
celery -A celery_app beat -l INFO
```

## Frontend setup

1. Install dependencies

```powershell
cd frontend
npm install
```

2. Create env file

```powershell
copy .env.example .env.local
```

3. Start frontend

```powershell
npm run dev
```

Frontend runs on port 3000 by default.

## 7) Environment Variables

## Backend (backend/.env)

Start from backend/.env.example.

Important keys:
- DJANGO_SECRET_KEY: required in all environments
- DEBUG: true for local development
- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT: database connection
- REDIS_URL: celery broker/backend and cache usage
- JWT_ACCESS_TOKEN_LIFETIME, JWT_REFRESH_TOKEN_LIFETIME: token timing
- AWS_STORAGE_BUCKET_NAME and AWS credentials: receipt storage
- CARD_NETWORK_WEBHOOK_SECRET: HMAC verification for card webhook
- EMAIL_FROM, RESEND_API_KEY: email sender setup
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER: SMS setup
- CORS_ALLOWED_ORIGINS: frontend origin allowlist
- OTP_SECRET_KEY: OTP session security

## Frontend (frontend/.env.local)

- NEXT_PUBLIC_API_URL= (optional, for direct browser calls)
- BACKEND_INTERNAL_URL=http://127.0.0.1:8000 (used by Next.js API proxy)

## 8) Running the System

## Service URLs
- Frontend app: http://localhost:3000
- Backend API base: http://127.0.0.1:8000/api/v1
- OpenAPI schema: http://127.0.0.1:8000/api/schema/
- Swagger UI: http://127.0.0.1:8000/api/docs/

## Auth flow
1. POST auth/login/ with email
2. POST auth/verify-otp/ with session token and otp
3. Receive access and refresh tokens
4. Frontend attaches Bearer access token for API requests
5. Frontend interceptor refreshes token on 401 when refresh token exists

## 9) API Surface

Main route groups:
- /api/v1/auth/
- /api/v1/companies/
- /api/v1/users/
- /api/v1/expenses/
- /api/v1/cards/
- /api/v1/approvals/
- /api/v1/budgets/
- /api/v1/reports/
- /api/v1/notifications/
- /api/v1/audit/
- /api/v1/webhooks/cards/

For complete endpoint schema, use the generated docs endpoint.

## 10) Security and Tenant Isolation

Primary controls in codebase:
- Tenant context injection in middleware
- Tenant-filtering base viewset for business querysets
- Role and ownership permission classes in DRF layer
- Self-approval prevention logic for expense approvals
- Webhook signature verification for card network callbacks
- Production security settings (HTTPS, HSTS, secure cookies)

Important operating rule:
- Never accept company_id from client payload for tenant scoping. Tenant context is server derived.

## 11) Async Jobs and Queues

Configured queues include:
- ocr
- notifications
- email
- sms
- reports
- webhooks
- periodic

Typical task examples:
- receipt OCR processing
- approval notifications
- report generation
- card webhook processing
- budget threshold checks

If using default development settings only, Celery runs eager mode in memory by default.

## 12) Frontend Behavior and UX Notes

- Protected dashboard surfaces depend on authenticated user session
- Approval actions are role-gated and hidden for self-owned expenses
- Employee expense detail supports OCR polling for draft receipts
- Settings page includes company reimbursement defaults and policy controls

## 13) Troubleshooting

## 1. Backend fails with ModuleNotFoundError: django
Cause:
- Virtual environment not activated or dependencies not installed

Fix:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements\base.txt
pip install -r requirements\development.txt
```

## 2. Frontend cannot reach API
Symptoms:
- Network errors to auth or expense endpoints

Checks:
- Ensure backend is running on 127.0.0.1:8000
- Verify NEXT_PUBLIC_API_URL in .env.local
- Restart frontend dev server after env changes

## 3. OTP verify fails repeatedly
Checks:
- Confirm same session_token from login step is used
- Ensure OTP not expired (TTL)
- Ensure attempts have not exceeded limit
- In DEBUG mode, check backend console output for generated OTP

## 4. 401 loops in frontend
Cause:
- Invalid or expired refresh token

Fix:
- Clear stored session token state
- Log in again
- Confirm auth token refresh endpoint is reachable

## 5. Celery tasks not running
Checks:
- Confirm Redis is running
- Confirm celery worker is running
- Confirm queue names match command Q list
- Inspect worker logs for import or serialization errors

## 6. Receipt upload problems
Checks:
- Content type is one of allowed formats
- AWS credentials and bucket config are valid for non-dev storage
- For development, ensure MEDIA_ROOT path is writable

## 7. Webhook signature failures
Checks:
- Incoming header format must match expected sha256 signature format
- Shared secret must exactly match CARD_NETWORK_WEBHOOK_SECRET
- Ensure request body is unmodified before signature check

## 8. CORS errors in browser
Checks:
- Add frontend origin to CORS_ALLOWED_ORIGINS
- Restart backend after env changes
- Ensure protocol and host exactly match

## 9. Database migration issues
Checks:
- Run showmigrations to inspect state
- Ensure DB credentials and host are correct
- For Docker, verify postgres container is healthy

Useful commands:
```powershell
python manage.py showmigrations
python manage.py makemigrations
python manage.py migrate
```

## 10. TypeScript warning about baseUrl deprecation
Current status:
- This can appear in editor diagnostics depending on TypeScript version

Fix options:
- Add ignoreDeprecations in tsconfig
- Or migrate to recommended path settings for your target TypeScript version

## 14) Useful Commands

## Backend
```powershell
cd backend
python manage.py migrate
python manage.py runserver
python -m compileall apps config celery_app.py
python manage.py test
```

## Frontend
```powershell
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

## Docker backend stack
```powershell
cd backend
docker compose up --build
docker compose down
```

## 15) Deployment Notes

## Backend
- Use production settings module
- Provide required environment variables through host platform
- Configure PostgreSQL and Redis managed services
- Ensure secure cookie and CORS values are production-safe
- Configure Sentry DSN and log sinks

## Frontend
- Set NEXT_PUBLIC_API_URL to public backend origin
- Use production build and start process

## 16) Known Gaps and Next Priorities

Areas that may require additional completion or hardening depending on rollout scope:
- Additional admin UX depth for approvals, cards, and policy management
- Full end-to-end report history and download lifecycle UX
- Expanded audit filtering and operational dashboards
- End-to-end integration tests across auth, approvals, and webhook flows

---

For architecture rationale and deeper implementation context, refer to:
- p_architecture.md
- p_audit_and_security.md
- p_ui_ux.md
- 1_plan.md
