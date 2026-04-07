export type UserRole = "admin" | "finance" | "manager" | "employee";

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  department: string;
  employee_code: string;
  manager: string | null;
  manager_name?: string;
  is_active: boolean;
  reports_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user: string;
  user_name: string;
  card: string | null;
  card_last_four?: string;
  amount: string;
  currency: string;
  category: string;
  description: string;
  merchant_name: string;
  merchant_mcc: string;
  expense_date: string;
  receipt_key: string;
  ocr_data: Record<string, string>;
  status: "draft" | "submitted" | "pending_approval" | "approved" | "rejected" | "reimbursed";
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approved_by_name?: string;
  rejection_reason: string;
  is_policy_flagged: boolean;
  policy_flag_reason: string;
  current_step?: number;
  total_steps?: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  last_four: string;
  card_type: string;
  network: string;
  status: "pending" | "active" | "frozen" | "blocked";
  monthly_limit: string;
  daily_limit: string;
  available_balance: string;
  issued_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardTransaction {
  id: string;
  card: string;
  external_id: string;
  transaction_type: "debit" | "credit";
  amount: string;
  currency: string;
  merchant_name: string;
  merchant_mcc: string;
  transaction_at: string;
  description: string;
  created_at: string;
}

export interface Budget {
  id: string;
  department: string;
  category: string;
  period: string;
  period_start: string;
  amount: string;
  alert_threshold: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetUtilisation {
  department: string;
  category: string;
  period: string;
  budget_amount: string;
  spent: string;
  remaining: string;
  utilisation_pct: string;
  status: "normal" | "warning" | "critical";
}

export interface Company {
  id: string;
  name: string;
  gst_number: string;
  pan_number: string;
  plan: string;
  is_active: boolean;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: string;
  company: string;
  reimbursement_bank_account: string;
  reimbursement_ifsc: string;
  default_currency: string;
  expense_submission_window_days: number;
  created_at: string;
  updated_at: string;
}

export interface ExpensePolicy {
  id: string;
  policy_type: string;
  applies_to_role: string;
  applies_to_category: string;
  value: Record<string, unknown>;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url: string;
  metadata: Record<string, string>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor: string | null;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state: Record<string, string>;
  after_state: Record<string, string>;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

export interface DashboardAnalytics {
  total_spend_mtd: string;
  active_employees: number;
  pending_approvals: number;
  cards_issued: number;
  category_breakdown: Array<{ category: string; total: string; count: number }>;
  monthly_trend: Array<{ month: string; total: string }>;
}

export interface ExpenseFilters {
  search?: string;
  status?: string;
  category?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
}
