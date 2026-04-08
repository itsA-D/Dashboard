import Link from "next/link";
import { SimpleTable } from "@/components/common/simple-table";
import { ExpenseStatusBadge } from "@/components/expense/expense-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

export function ExpenseTable({ expenses, detailPrefix = "/expenses" }: { expenses: Expense[]; detailPrefix?: string }) {
  return (
    <SimpleTable
      columns={["Employee", "Merchant", "Category", "Amount", "Date", "Status"]}
      rows={expenses.map((expense) => [
        <Link key={`${expense.id}-user`} href={`${detailPrefix}/${expense.id}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          {expense.user_name}
        </Link>,
        expense.merchant_name || "—",
        expense.category,
        formatCurrency(expense.amount),
        formatDate(expense.expense_date),
        <ExpenseStatusBadge key={`${expense.id}-status`} status={expense.status} />
      ])}
    />
  );
}
