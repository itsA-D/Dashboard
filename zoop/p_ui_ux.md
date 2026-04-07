# Zoop
 — UI/UX & Frontend Architecture
## Next.js 14 + Tailwind + TanStack Query

> The dashboard is the product. This document defines every screen, component, state pattern, API integration approach, and UX rule for the Zoffl frontend.

---

## 1. Executive Summary

Zoffl serves three fundamentally different users in the same Next.js app:

| User | Primary device | Mental model | UX priority |
|---|---|---|---|
| Finance Admin | Desktop, all day | Power user — data, control, export | Density, filters, bulk actions |
| Manager | Desktop + mobile, in bursts | Task-oriented — approve/reject and move on | Speed, clarity, mobile-friendly |
| Employee | Mobile-first | Consumer app feel — submit, check, done | Simplicity, OCR magic, status clarity |

All three share one codebase. Role-based shell selection at the layout level renders the appropriate navigation and surface — no separate apps.

---

## 2. Frontend Tech Stack

```
Framework:        Next.js 14 (App Router, TypeScript)
Styling:          Tailwind CSS 3 + shadcn/ui
Server state:     TanStack Query v5 (React Query)
Client UI state:  Zustand 4
Forms:            React Hook Form + Zod
Tables:           TanStack Table v8
Charts:           Recharts 2
File upload:      react-dropzone → S3 presigned URL
HTTP client:      Axios with interceptors
Dates:            date-fns 3
Toast:            Sonner
Icons:            Lucide React
Auth:             JWT stored in memory + httpOnly cookie refresh
API type safety:  Zod schemas shared with form validation
```

---

## 3. Project Structure

```
zoffl-frontend/
├── app/                              Next.js App Router
│   ├── layout.tsx                    Root layout — global providers only
│   ├── (auth)/                       Auth group — no shell
│   │   ├── login/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   └── layout.tsx                Centered card layout
│   │
│   └── (dashboard)/                  Protected group — role shell
│       ├── layout.tsx                Resolves shell by role
│       │
│       ├── dashboard/page.tsx        Admin: KPIs, charts, activity
│       │
│       ├── employees/
│       │   ├── page.tsx              Employee list
│       │   └── [id]/page.tsx         Employee detail
│       │
│       ├── expenses/
│       │   ├── page.tsx              Expense list (admin/finance/manager)
│       │   └── [id]/page.tsx         Expense detail + approval actions
│       │
│       ├── approvals/
│       │   └── page.tsx              Approval queue
│       │
│       ├── cards/
│       │   ├── page.tsx              Card management
│       │   └── [id]/page.tsx         Card detail + transaction history
│       │
│       ├── budgets/
│       │   └── page.tsx              Dept budget tracker
│       │
│       ├── reports/
│       │   └── page.tsx              Generate + download reports
│       │
│       ├── audit/
│       │   └── page.tsx              Audit log (finance/admin only)
│       │
│       ├── settings/
│       │   └── page.tsx              Company, policies, teams
│       │
│       └── me/                       Employee self-service
│           ├── page.tsx              Balance, recent transactions, quick actions
│           ├── expenses/
│           │   ├── page.tsx          My expense history
│           │   ├── new/page.tsx      Submit expense
│           │   └── [id]/page.tsx     Expense detail + status timeline
│           ├── card/page.tsx         My card + balance
│           └── reimbursements/       Payout history
│               └── page.tsx
│
├── components/
│   ├── ui/                           shadcn/ui base components (auto-generated)
│   │
│   ├── layout/
│   │   ├── AdminShell.tsx            Full sidebar + topbar
│   │   ├── ManagerShell.tsx          Condensed nav
│   │   ├── EmployeeShell.tsx         Bottom nav (mobile), sidebar (desktop)
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── BottomNav.tsx
│   │
│   ├── expense/
│   │   ├── ExpenseTable.tsx          TanStack Table, server-side pagination
│   │   ├── ExpenseForm.tsx           Submit/edit form
│   │   ├── ReceiptUploader.tsx       Dropzone + S3 + OCR feedback
│   │   ├── ExpenseStatusBadge.tsx    Single source of status → colour mapping
│   │   ├── ExpenseDetailPanel.tsx    Full detail view
│   │   └── ExpenseStatusTimeline.tsx Step-by-step approval history
│   │
│   ├── approval/
│   │   ├── ApprovalQueue.tsx         List of pending approvals
│   │   ├── ApprovalActionBar.tsx     Approve/Reject/Request info sticky bar
│   │   └── BulkApprovalModal.tsx     Confirm bulk approve
│   │
│   ├── card/
│   │   ├── CardWidget.tsx            Visual card with balance + status
│   │   ├── CardTable.tsx             Admin card list
│   │   ├── CardActionsMenu.tsx       Freeze / Block / Limit
│   │   └── CardTransactionList.tsx   Transaction history
│   │
│   ├── budget/
│   │   ├── BudgetProgressCard.tsx    Dept spend vs limit bar
│   │   ├── BudgetTable.tsx           Edit/create budgets
│   │   └── BudgetAlertBadge.tsx      Warning / danger at threshold
│   │
│   ├── charts/
│   │   ├── SpendTrendChart.tsx       Bar + line (budget overlay)
│   │   ├── CategoryDonutChart.tsx    Spend by category
│   │   ├── DeptBarChart.tsx          Department comparison
│   │   └── MonthOverMonthChart.tsx   MoM trend line
│   │
│   ├── dashboard/
│   │   ├── KPICard.tsx               Summary number card
│   │   └── ActivityFeed.tsx          Real-time event list
│   │
│   └── common/
│       ├── DataTable.tsx             Generic TanStack Table wrapper
│       ├── EmptyState.tsx            Empty + filtered states
│       ├── LoadingSkeleton.tsx       Shape-matched skeletons
│       ├── ConfirmDialog.tsx         Reusable confirm modal
│       ├── FilterBar.tsx             Reusable filter row
│       └── PageHeader.tsx            Title + breadcrumb + actions
│
├── lib/
│   ├── api/
│   │   ├── client.ts                 Axios instance with interceptors
│   │   ├── expenses.ts               Expense API functions
│   │   ├── cards.ts                  Card API functions
│   │   ├── users.ts                  User API functions
│   │   ├── budgets.ts                Budget API functions
│   │   ├── reports.ts                Report API functions
│   │   └── notifications.ts          Notification API functions
│   │
│   ├── query-keys.ts                 All TanStack Query key factories
│   ├── auth.ts                       Token management, session helpers
│   └── utils.ts                      Formatters (currency, date, initials)
│
├── schemas/                          Zod validation schemas
│   ├── expense.schema.ts
│   ├── user.schema.ts
│   ├── card.schema.ts
│   └── budget.schema.ts
│
├── stores/
│   └── ui.store.ts                   Zustand: filters, selections, modals
│
├── types/
│   └── index.ts                      TypeScript types matching Django models
│
└── hooks/
    ├── useExpenses.ts                 Data hooks (wrap TanStack Query)
    ├── useCards.ts
    ├── useApprovals.ts
    ├── useAuth.ts
    └── useNotifications.ts
```

---

## 4. Root Layout — Providers Only

```tsx
// app/layout.tsx
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>        {/* TanStack Query client */}
          <AuthProvider>      {/* Session context */}
            <ThemeProvider>   {/* Light/dark */}
              {children}
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
```

Rules:
- No business logic in `RootLayout`
- No data fetching at root
- Providers wrap in this exact order (Query → Auth → Theme)

---

## 5. Role-Based Shell Selection

```tsx
// app/(dashboard)/layout.tsx
import { AdminShell } from '@/components/layout/AdminShell'
import { ManagerShell } from '@/components/layout/ManagerShell'
import { EmployeeShell } from '@/components/layout/EmployeeShell'
import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

const SHELL_MAP = {
  admin: AdminShell,
  finance: AdminShell,     // Finance uses same shell as admin
  manager: ManagerShell,
  employee: EmployeeShell,
}

export default async function DashboardLayout({ children }) {
  const user = await getServerSession()   // RSC — no client fetch
  if (!user) redirect('/login')

  const Shell = SHELL_MAP[user.role]
  return <Shell user={user}>{children}</Shell>
}
```

---

## 6. API Client (Axios with Django JWT)

```typescript
// lib/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // For httpOnly refresh token cookie
})

// Request: attach access token from memory
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()  // In-memory, never localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: auto-refresh on 401
let isRefreshing = false
let failedQueue: any[] = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post('/api/v1/auth/token/refresh/', {}, { withCredentials: true })
        tokenStore.setAccessToken(data.access)
        failedQueue.forEach(p => p.resolve(data.access))
        failedQueue = []
        return apiClient(original)
      } catch {
        failedQueue.forEach(p => p.reject(error))
        failedQueue = []
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

---

## 7. State Management

### Server state — TanStack Query

All data from Django lives in TanStack Query. Structured query keys:

```typescript
// lib/query-keys.ts
export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
    mine: (filters?: ExpenseFilters) => ['expenses', 'mine', filters] as const,
  },
  cards: {
    all: ['cards'] as const,
    list: () => ['cards', 'list'] as const,
    detail: (id: string) => ['cards', 'detail', id] as const,
    transactions: (id: string) => ['cards', id, 'transactions'] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    utilisation: () => ['budgets', 'utilisation'] as const,
  },
  approvals: {
    queue: () => ['approvals', 'queue'] as const,
  },
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
  },
  notifications: {
    list: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
}
```

### Optimistic updates (approval actions)

```typescript
// hooks/useApprovals.ts
export function useApproveExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      apiClient.post(`/expenses/${id}/approve/`, { comment }),

    onMutate: async ({ id }) => {
      // Cancel in-flight fetches for this expense
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.detail(id) })
      // Snapshot for rollback
      const snapshot = queryClient.getQueryData(queryKeys.expenses.detail(id))
      // Optimistically update status
      queryClient.setQueryData(queryKeys.expenses.detail(id), (old: any) => ({
        ...old,
        status: 'approved',
      }))
      return { snapshot }
    },

    onError: (_err, { id }, ctx) => {
      // Rollback on failure
      queryClient.setQueryData(queryKeys.expenses.detail(id), ctx?.snapshot)
      toast.error('Failed to approve expense')
    },

    onSuccess: (_data, { id }) => {
      // Invalidate approval queue
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.queue() })
      toast.success('Expense approved')
    },
  })
}
```

### Client UI state — Zustand

```typescript
// stores/ui.store.ts
import { create } from 'zustand'

interface UIStore {
  // Table selection
  selectedExpenseIds: string[]
  setSelectedExpenseIds: (ids: string[]) => void
  clearSelection: () => void

  // Filters (synced to URL)
  expenseFilters: ExpenseFilters
  setExpenseFilters: (filters: Partial<ExpenseFilters>) => void

  // Modals
  confirmDialog: {
    open: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null
  openConfirmDialog: (config: Omit<ConfirmDialogConfig, 'open'>) => void
  closeConfirmDialog: () => void

  // Layout
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedExpenseIds: [],
  setSelectedExpenseIds: (ids) => set({ selectedExpenseIds: ids }),
  clearSelection: () => set({ selectedExpenseIds: [] }),
  expenseFilters: defaultFilters,
  setExpenseFilters: (filters) =>
    set((state) => ({ expenseFilters: { ...state.expenseFilters, ...filters } })),
  confirmDialog: null,
  openConfirmDialog: (config) => set({ confirmDialog: { ...config, open: true } }),
  closeConfirmDialog: () => set({ confirmDialog: null }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
```

---

## 8. Screen Design: Admin Dashboard

### KPI row
Four cards, each with:
- Icon (colour-coded by type)
- Metric label (12px muted)
- Value (22px, medium weight)
- Trend: "↑ 12.4% vs last month" — green for positive spend context, contextual for others

KPI cards: Total Spend MTD, Active Employees, Pending Approvals (with count badge), Cards Issued.

### Charts row (2-column)
Left (wider): Monthly spend trend — bar chart per month + budget line overlay. Toggle: 6M / 1Y / All.
Right: Category donut — Travel, Meals, Fuel, Other with custom legend (percentage inline).

### Content row (2-column)
Left: Expense Reports table — tabs: Pending / Approved / Rejected. Columns: Employee, Category, Amount, Date, Status. Compact, row-clickable.
Right: Department Budget progress cards — each shows: dept name, ₹ spent / ₹ total, animated progress bar. Colour: green <70%, amber 70–89%, red ≥90%.

### Bottom row (2-column)
Left: Card Management table — Cardholder, masked card number, limit, utilisation mini-bar, status pill.
Right: Activity Feed — chronological event list (approval, limit alert, policy flag, onboarding). Colour dot per event type.

---

## 9. Screen Design: Expense Submission (Employee)

This is the most-used screen for employees. Optimise for mobile.

### Step flow
```
Step 1: Upload receipt (camera or gallery on mobile)
   ↓ OCR runs in background (Celery worker)
Step 2: Review pre-filled fields (animated fill-in)
   ↓ User edits if needed
Step 3: Confirm + submit
   ↓ Policy engine validates
Step 4: Status tracking
```

### OCR pre-fill UX
```tsx
// Skeleton while OCR is pending
{expense.ocr_data && Object.keys(expense.ocr_data).length === 0 ? (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />  {/* Amount field */}
    <Skeleton className="h-10 w-full" />  {/* Merchant field */}
    <Skeleton className="h-10 w-2/3" />   {/* Date field */}
    <p className="text-xs text-muted-foreground">Scanning receipt…</p>
  </div>
) : (
  <ExpenseFormFields prefilled={expense.ocr_data} />
)}
```

When OCR resolves, fields animate in with a "Extracted from receipt" chip. Every field remains editable — OCR is a suggestion, not a lock.

### Zod form schema

```typescript
// schemas/expense.schema.ts
import { z } from 'zod'

export const expenseSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .max(500000, 'Exceeds maximum single-transaction limit'),
  expense_date: z
    .date()
    .max(new Date(), 'Cannot submit future-dated expenses'),
  merchant_name: z
    .string()
    .min(2, 'Merchant name too short')
    .max(100),
  category: z.enum(['travel','meals','fuel','accommodation','medical','telecom','other'], {
    required_error: 'Please select a category',
  }),
  description: z.string().max(500).optional(),
  receipt_key: z.string().optional(),
}).refine(
  (data) => data.amount < 500 || !!data.receipt_key,
  { message: 'Receipt required for expenses above ₹500', path: ['receipt_key'] }
)
```

---

## 10. Screen Design: Approval Queue (Manager/Finance)

### Layout
- Filter row: Date range | Category | Department | Search by name/merchant
- Table: Employee, Description, Amount, Category, Date, Days pending, Actions
- Inline quick actions: ✅ Approve | ❌ Reject (opens comment dialog)
- Bulk selection with floating action bar: "Approve 12 selected"

### ApprovalActionBar component
Sticky bar at bottom of expense detail, visible only when current user is an eligible approver for that specific expense:

```tsx
function ApprovalActionBar({ expense }: { expense: Expense }) {
  const { mutate: approve, isPending: approving } = useApproveExpense()
  const { mutate: reject, isPending: rejecting } = useRejectExpense()
  const [rejectComment, setRejectComment] = useState('')

  // Never show for own expenses
  if (expense.user.id === currentUser.id) return null

  return (
    <div className="sticky bottom-0 bg-background border-t p-4 flex gap-3 items-center">
      <Button
        onClick={() => approve({ id: expense.id })}
        disabled={approving}
        className="bg-green-600 hover:bg-green-700"
      >
        {approving ? 'Approving…' : 'Approve'}
      </Button>
      <RejectDialog
        onConfirm={(comment) => reject({ id: expense.id, comment })}
        isPending={rejecting}
      />
      <span className="text-sm text-muted-foreground ml-auto">
        Step {expense.current_step} of {expense.total_steps}
      </span>
    </div>
  )
}
```

---

## 11. Expense Status System

Single source of truth — never define status colours anywhere else:

```typescript
// components/expense/ExpenseStatusBadge.tsx
const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  pending_approval: {
    label: 'Pending approval',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  reimbursed: {
    label: 'Reimbursed',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
} as const

export function ExpenseStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
```

---

## 12. Receipt Uploader Component

```tsx
// components/expense/ReceiptUploader.tsx
export function ReceiptUploader({ onUploadComplete, expenseId }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setUploading(true)
    // 1. Get presigned URL from Django
    const { data } = await apiClient.post('/expenses/upload-receipt/', {
      expense_id: expenseId,
      content_type: file.type,
    })

    // 2. Upload directly to S3 with progress
    await axios.put(data.upload_url, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total!) * 100)),
    })

    // 3. Show preview for images
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    }

    onUploadComplete(data.receipt_key)
    setUploading(false)
  }, [expenseId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,  // 10 MB
  })

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
      ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
      <input {...getInputProps()} />
      {uploading ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : preview ? (
        <img src={preview} className="max-h-32 mx-auto rounded object-cover" alt="Receipt preview" />
      ) : (
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Drop receipt here' : 'Drag receipt here, or tap to browse'}
        </p>
      )}
    </div>
  )
}
```

---

## 13. Mobile-First Rules (Employee Shell)

The employee panel must work one-handed on a 390px screen.

### Bottom navigation

```tsx
// components/layout/BottomNav.tsx
const EMPLOYEE_NAV = [
  { href: '/me', label: 'Home', icon: Home },
  { href: '/me/expenses/new', label: 'Submit', icon: Plus, primary: true },
  { href: '/me/expenses', label: 'Expenses', icon: Receipt },
  { href: '/me/card', label: 'Card', icon: CreditCard },
]
```

### Touch targets
- Minimum 44x44px for all interactive elements
- Form inputs at minimum 48px height on mobile
- No hover-only affordances

### Breakpoints
```
mobile:  < 640px   — employee primary, bottom nav
tablet:  640–1024px
desktop: > 1024px  — admin/finance primary, sidebar nav
```

---

## 14. Empty, Loading, and Error States

Every list, table, and chart must implement all four states.

| State | Implementation |
|---|---|
| Loading | Shape-matched `Skeleton` component — matches exact layout of loaded content |
| Empty (no data) | `EmptyState` with icon, message, and primary action ("Submit your first expense") |
| Empty (filtered) | `EmptyState` with "No results for these filters" + "Clear filters" link |
| Error | Error message card + "Retry" button — log to Sentry |

```tsx
// components/common/EmptyState.tsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  )
}
```

---

## 15. Notifications System

### Polling (simple, reliable)

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiClient.get('/notifications/').then(r => r.data),
    refetchInterval: 30_000,  // Poll every 30s
    refetchIntervalInBackground: false,
  })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  return data?.filter(n => !n.is_read).length ?? 0
}
```

### Notification types → routing

```typescript
const NOTIFICATION_ROUTES: Record<string, (meta: any) => string> = {
  'expense.approval_needed':  (m) => `/expenses/${m.expense_id}`,
  'expense.approved':         (m) => `/me/expenses/${m.expense_id}`,
  'expense.rejected':         (m) => `/me/expenses/${m.expense_id}`,
  'card.limit_alert':         (m) => `/cards/${m.card_id}`,
  'budget.threshold_reached': (m) => `/budgets`,
}
```

---

## 16. Filter State — URL Sync

Filters are always synced to URL search params so links are shareable and the back button works.

```typescript
// hooks/useExpenseFilters.ts
import { useRouter, useSearchParams } from 'next/navigation'

export function useExpenseFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const filters: ExpenseFilters = {
    status: params.get('status') || 'all',
    category: params.get('category') || 'all',
    date_from: params.get('date_from') || '',
    date_to: params.get('date_to') || '',
    search: params.get('search') || '',
    department: params.get('department') || 'all',
  }

  function setFilters(updates: Partial<ExpenseFilters>) {
    const next = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'all') next.set(k, v)
      else next.delete(k)
    })
    router.replace(`?${next.toString()}`)
  }

  return { filters, setFilters }
}
```

---

## 17. Report Generation UX

Reports are generated async by a Celery worker. The frontend polls for completion.

```tsx
function ReportPage() {
  const [reportId, setReportId] = useState<string | null>(null)

  const { mutate: generateReport, isPending } = useMutation({
    mutationFn: (params) => apiClient.post('/reports/generate/', params),
    onSuccess: (data) => {
      setReportId(data.data.report_id)
      toast.info('Generating report…')
    },
  })

  // Poll until ready
  const { data: report } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => apiClient.get(`/reports/${reportId}/`).then(r => r.data),
    enabled: !!reportId,
    refetchInterval: (data) => data?.status === 'ready' ? false : 3000,
  })

  useEffect(() => {
    if (report?.status === 'ready') {
      toast.success('Report ready', {
        action: { label: 'Download', onClick: () => window.open(report.download_url) },
        duration: 10000,
      })
    }
  }, [report?.status])
  ...
}
```

---

## 18. Frontend Checklist

- [ ] Root `layout.tsx` contains only providers — no data fetching, no business logic
- [ ] All server state lives in TanStack Query — nothing duplicated in Zustand
- [ ] Zustand only holds UI state: selections, filter state, open modals
- [ ] All filter state is synced to URL params — shareable links, working back button
- [ ] Access token stored in memory only — never `localStorage`
- [ ] Axios interceptor handles JWT refresh transparently
- [ ] `ExpenseStatusBadge` is the single source of status colour mapping
- [ ] `ReceiptUploader` uploads directly to S3 via presigned URL — never through Django
- [ ] OCR pre-fill shows skeleton until `ocr_data` populated — all fields editable
- [ ] Approval action bar checks `expense.user.id !== currentUser.id` before rendering
- [ ] All tables have: loading skeletons, empty state, filtered-empty state, error state
- [ ] Employee shell works one-handed at 390px — bottom nav, 44px touch targets
- [ ] Notifications poll every 30s; unread count shown in topbar badge
- [ ] Report generation uses async polling — never blocks the UI
- [ ] `drf-spectacular` schema imported to generate TypeScript types (optional: openapi-typescript)

---

> **Core principle:** The employee submitting an expense at 9 PM on a phone and the finance manager reviewing 200 claims on a Monday morning use the same codebase — but the role-based shell selection means they never see each other's complexity. Keep each surface honest about who it serves.
