import { DataPanel } from "@/components/common/data-panel";
import { ExpenseStatusBadge } from "@/components/expense/expense-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

export function ExpenseDetail({ expense }: { expense: Expense }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <DataPanel title={expense.description || expense.merchant_name || "Expense detail"} subtitle={expense.user_name}>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Amount" value={formatCurrency(expense.amount)} />
          <Detail label="Date" value={formatDate(expense.expense_date)} />
          <Detail label="Category" value={expense.category} />
          <Detail label="Merchant" value={expense.merchant_name || "—"} />
          <Detail label="Card" value={expense.card_last_four ? `•••• ${expense.card_last_four}` : "Not linked"} />
          <Detail label="Approved by" value={expense.approved_by_name || "—"} />
        </dl>
      </DataPanel>
      <DataPanel title="Workflow" subtitle="Policy and approval state">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate">Current status</span>
            <ExpenseStatusBadge status={expense.status} />
          </div>
          <div className="rounded-2xl bg-paper p-4 text-sm text-slate">
            <p>Submitted: {formatDate(expense.submitted_at, "dd MMM yyyy, p")}</p>
            <p className="mt-2">Approved: {formatDate(expense.approved_at, "dd MMM yyyy, p")}</p>
            <p className="mt-2">Steps: {expense.current_step ?? 0} / {expense.total_steps ?? 0}</p>
          </div>
          {expense.is_policy_flagged ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Policy flag: {expense.policy_flag_reason}
            </div>
          ) : null}
          {expense.rejection_reason ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              Rejection reason: {expense.rejection_reason}
            </div>
          ) : null}
        </div>
      </DataPanel>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <dt className="text-xs uppercase tracking-[0.22em] text-slate">{label}</dt>
      <dd className="mt-2 text-base font-medium text-ink">{value}</dd>
    </div>
  );
}
