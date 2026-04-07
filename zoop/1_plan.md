 
Zaggle Dashboard — Implementation Plan


Context



 Zaggle Dashboard is a multi-tenant B2B SaaS for Indian corporates that restructures employee CTC to
 maximize in-hand salary via tax-exempt expense categories. The project has fully defined architecture in
 three .md files: p_architecture.md (Django backend + Next.js frontend), p_audit_and_security.md (RBAC,
 auth, audit), and p_ui_ux.md (role-based shells, state management).

 Goal: Build the full project from scratch in two phases — backend first, then frontend.

 ---
 Phase 1: Django Backend

 Project Structure

 zaggle_backend/
 ├── config/
 │   ├── settings/
 │   │   ├── base.py
 │   │   ├── development.py
 │   │   └── production.py
 │   ├── urls.py
 │   ├── wsgi.py
 │   └── asgi.py
 ├── apps/
 │   ├── core/                  # BaseModel, permissions, middleware, pagination, exceptions
 │   ├── companies/            # Tenant model + settings
 │   ├── users/                # User model, auth views, RBAC
 │   ├── expenses/             # Expense lifecycle, policy engine
 │   ├── cards/                # Card model, webhooks, freeze/unfreeze
 │   ├── approvals/            # ApprovalFlow, ApprovalStep, ApprovalAction
 │   ├── budgets/              # Budget + utilisation tracking
 │   ├── reports/              # Async report generation
 │   ├── notifications/        # In-app + email + SMS dispatch
 │   └── audit/                # Immutable AuditLog (append-only)
 ├── celery_app.py
 ├── manage.py
 ├── requirements/
 │   ├── base.txt
 │   ├── development.txt
 │   └── production.txt
 ├── Dockerfile
 ├── docker-compose.yml
 └── .env.example

 Apps Implementation Order

 ┌─────┬───────────────┬───────────────────────────────────┬───────────────────────────────────────────────┐
 │  #  │      App      │              Models               │               Key Views/Actions               │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │     │               │ BaseModel, TenantMiddleware,      │ Middleware, permission classes,               │
 │ 1   │ core          │ IsAuthenticated,                  │ CursorPagination, custom_exception_handler    │
 │     │               │ CanApproveExpense                 │                                               │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 2   │ companies     │ Company, CompanySettings          │ CRUD, tenant detail                           │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 3   │ users         │ User (extends AbstractBaseUser)   │ Login OTP, verify OTP, token refresh, logout, │
 │     │               │                                   │  me, list, create, PATCH, deactivate          │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 4   │ expenses      │ Expense, ExpensePolicy            │ CRUD, submit, approve, reject, upload-receipt │
 │     │               │                                   │  (presigned S3), receipt download             │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 5   │ cards         │ Card, CardTransaction             │ CRUD, issue, freeze, unfreeze, block,         │
 │     │               │                                   │ update-limit, transactions, webhook           │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 6   │ approvals     │ ApprovalFlow, ApprovalStep,       │ Flow CRUD, queue, engine (assign_flow,        │
 │     │               │ ApprovalAction                    │ advance)                                      │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 7   │ budgets       │ Budget, BudgetAlert               │ CRUD, utilisation endpoint, Celery alert      │
 │     │               │                                   │ checker                                       │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 8   │ reports       │ — (no model)                      │ Generate endpoint, download endpoint,         │
 │     │               │                                   │ analytics/dashboard endpoint                  │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 9   │ notifications │ Notification                      │ List, mark read, read-all; Celery tasks for   │
 │     │               │                                   │ email/SMS                                     │
 ├─────┼───────────────┼───────────────────────────────────┼───────────────────────────────────────────────┤
 │ 10  │ audit         │ AuditLog (no update/delete)       │ List view (admin/finance only)                │
 └─────┴───────────────┴───────────────────────────────────┴───────────────────────────────────────────────┘

 Key Implementation Decisions

 1. Auth: OTP-based login. Email OTP stored in Redis with 10-min TTL. JWT access (15min) + refresh (7 days).
  On logout, refresh token blacklisted.
 2. Tenant Isolation: TenantMiddleware injects request.company from authenticated user. All business
 ViewSets inherit TenantViewSet which auto-filters company_id. company field is read_only in all
 serializers.
 3. RBAC: Role hierarchy admin > finance > manager > employee. DRF BasePermission classes applied per action
  in get_permissions(). CanApproveExpense prevents self-approval.
 4. Receipt Flow: Client requests presigned S3 PUT URL → uploads directly to S3 → expense created with
 receipt_key. Receipt download via presigned GET URL (1hr expiry).
 5. Expense Workflow: draft → submitted → pending_approval → approved/rejected → reimbursed. Policy engine
 runs on submit to check amount limits, receipt requirements, duplicates, weekend blocks.
 6. Card Webhooks: HMAC-SHA256 verified. Webhook enqueues process_card_webhook Celery task. Card PAN never
 stored — only last_four and external_card_id.
 7. Audit: AuditMixin on all mutating ViewSets. Append-only AuditLog model. DB-level revoke on
 update/delete.

 Celery Tasks

 ┌────────────────────────────┬───────────────┬──────────────────────────────┐
 │            Task            │     Queue     │           Trigger            │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ process_receipt_ocr        │ ocr           │ Expense created with receipt │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ send_approval_notification │ notifications │ Expense submitted            │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ send_email                 │ email         │ Notification events          │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ send_sms                   │ sms           │ OTP, card transaction        │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ generate_report            │ reports       │ Report requested             │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ check_budget_alerts        │ periodic      │ Every 30 min (Celery Beat)   │
 ├────────────────────────────┼───────────────┼──────────────────────────────┤
 │ process_card_webhook       │ webhooks      │ Webhook received             │
 └────────────────────────────┴───────────────┴──────────────────────────────┘

 ---
 Phase 2: Next.js Frontend

 Project Structure

 zaggle-frontend/
 ├── app/
 │   ├── layout.tsx                    # Root: QueryProvider, AuthProvider, ThemeProvider, Toaster
 │   ├── (auth)/
 │   │   ├── login/page.tsx
 │   │   ├── verify-otp/page.tsx
 │   │   └── layout.tsx
 │   └── (dashboard)/                  # Role shell selected in layout
 │       ├── layout.tsx                # Resolves shell by role: Admin/Manager/Employee
 │       ├── dashboard/page.tsx        # Admin: KPIs, charts, activity
 │       ├── employees/
 │       ├── expenses/
 │       ├── approvals/
 │       ├── cards/
 │       ├── budgets/
 │       ├── reports/
 │       ├── audit/
 │       ├── settings/
 │       └── me/                       # Employee self-service
 ├── components/
 │   ├── ui/                           # shadcn/ui components
 │   ├── layout/                       # AdminShell, ManagerShell, EmployeeShell, Sidebar, Topbar, BottomNav
 │   ├── expense/                      # ExpenseTable, ExpenseForm, ReceiptUploader, ExpenseStatusBadge, ...
 │   ├── approval/                     # ApprovalQueue, ApprovalActionBar, BulkApprovalModal
 │   ├── card/                         # CardWidget, CardTable, CardActionsMenu, CardTransactionList
 │   ├── budget/                       # BudgetProgressCard, BudgetTable, BudgetAlertBadge
 │   ├── charts/                       # SpendTrendChart, CategoryDonutChart, DeptBarChart,
 MonthOverMonthChart
 │   ├── dashboard/                    # KPICard, ActivityFeed
 │   └── common/                       # DataTable, EmptyState, LoadingSkeleton, ConfirmDialog, FilterBar
 ├── lib/
 │   ├── api/                          # Axios client + API functions per domain
 │   ├── providers/                    # QueryProvider, AuthProvider
 │   ├── query-keys.ts
 │   └── utils.ts
 ├── schemas/                          # Zod validation schemas
 ├── stores/                           # Zustand: ui.store.ts
 ├── types/
 └── hooks/                            # TanStack Query hooks: useExpenses, useCards, useApprovals, useAuth

 Frontend Implementation Order

 ┌─────┬───────────────────────────┬───────────────────────────────────────────────────────────────────────┐
 │  #  │          Module           │                            Key Components                             │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 1   │ Auth flow                 │ login page → OTP request → verify OTP → token management              │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 2   │ Root layout + providers   │ QueryProvider, AuthProvider, ThemeProvider, Toaster                   │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 3   │ Role shells               │ AdminShell (sidebar), ManagerShell (condensed), EmployeeShell (bottom │
 │     │                           │  nav)                                                                 │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 4   │ API client                │ Axios with JWT interceptors, auto-refresh on 401                      │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 5   │ Dashboard (admin)         │ KPICard, SpendTrendChart, CategoryDonutChart, ExpenseTable,           │
 │     │                           │ BudgetProgressCard                                                    │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 6   │ Employee self-service     │ Balance card, quick actions, expense submission with OCR pre-fill     │
 │     │ (/me)                     │                                                                       │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 7   │ Expense submission        │ ReceiptUploader → OCR skeleton → editable form → submit               │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 8   │ Approval queue            │ ApprovalQueue, ApprovalActionBar (approve/reject), BulkApprovalModal  │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 9   │ Card management           │ CardWidget, CardTable, CardActionsMenu (freeze/block/limit)           │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 10  │ Budget tracker            │ BudgetProgressCard, BudgetTable                                       │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 11  │ Reports + Audit log       │ Async generation with polling, audit list                             │
 ├─────┼───────────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ 12  │ Notifications             │ Polling every 30s, unread badge, routing                              │
 └─────┴───────────────────────────┴───────────────────────────────────────────────────────────────────────┘

 Key Implementation Decisions

 1. Role shell selection: layout.tsx resolves shell from JWT role claim. Admin and Finance share AdminShell.
 2. Auth token storage: Access token in memory only (Zustand or module-level variable). Refresh token in
 httpOnly cookie. Axios interceptor handles auto-refresh.
 3. Server state: All Django API data in TanStack Query with structured queryKeys. Optimistic updates for
 approval actions.
 4. Client state: Zustand holds UI state only: filter selections, modal open/close, sidebar collapsed, table
  row selections.
 5. Receipt upload: Client → Django (presigned URL) → S3 directly → expense with receipt_key. OCR polls GET
 /expenses/{id}/ until ocr_data populated.
 6. Filter state: All table filters synced to URL search params via useSearchParams + router.replace.
 7. Responsive design: Employee shell mobile-first (bottom nav, 390px). Admin/Finance desktop-first (sidebar
  nav).

 ---
 Verification

 Backend

 - Run Django dev server: python manage.py runserver
 - Run Celery worker: celery -A celery_app worker -l INFO
 - Test OTP flow via Postman/curl
 - Run DRF browsable API — verify tenant isolation by checking all queries are scoped

 Frontend

 - Run dev server: npm run dev
 - Login as each role — verify correct shell renders
 - Submit expense as employee → verify OCR polling and status badge
 - Approve/reject as manager → verify action bar and optimistic update
 - Check all tables have: loading skeletons, empty states, error states

 ---
 Summary

 ┌──────────────────────────┬────────────────────────────────────────────────────────────────────────┐
 │           Area           │                               Key Files                                │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Backend entrypoint       │ config/urls.py, config/settings/base.py                                │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Tenant isolation         │ apps/core/middleware.py, apps/core/views.py                            │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Auth                     │ apps/users/views.py (LoginView, OTPView, TokenRefreshView, LogoutView) │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Expense workflow         │ apps/expenses/services.py (PolicyEngine, ExpenseService)               │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Card webhooks            │ apps/cards/webhooks.py (HMAC verification)                             │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Audit                    │ apps/audit/mixins.py (AuditMixin), apps/audit/models.py (AuditLog)     │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Frontend shell selection │ app/(dashboard)/layout.tsx                                             │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ API client               │ lib/api/client.ts (Axios + JWT interceptors)                           │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Expense status           │ components/expense/ExpenseStatusBadge.tsx                              │
 ├──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
 │ Receipt uploader         │ components/expense/ReceiptUploader.tsx                                 │
 └──────────────────────────┴────────────────────────────────────────────────────────────────────────┘