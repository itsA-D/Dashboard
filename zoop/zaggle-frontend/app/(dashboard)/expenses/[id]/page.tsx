"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { ApprovalActionBar } from "@/components/expense/approval-action-bar";
import { ExpenseDetail } from "@/components/expense/expense-detail";
import { useExpense } from "@/hooks/use-expenses";

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const expenseQuery = useExpense(params.id);

  if (!expenseQuery.data) {
    return <div className="text-sm text-slate">Loading expense...</div>;
  }

  return (
    <PageShell eyebrow="Expense review" title={expenseQuery.data.merchant_name || "Expense detail"} description={expenseQuery.data.description}>
      <ExpenseDetail expense={expenseQuery.data} />
      <ApprovalActionBar expense={expenseQuery.data} />
    </PageShell>
  );
}
