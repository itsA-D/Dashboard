"use client";

import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { ExpenseTable } from "@/components/expense/expense-table";
import { useExpenses } from "@/hooks/use-expenses";

export default function ExpensesPage() {
  const expensesQuery = useExpenses();

  return (
    <PageShell eyebrow="Expense desk" title="Company expense stream" description="Review submissions, policy flags, and outcomes across the tenant.">
      {!expensesQuery.data?.length ? (
        <EmptyState title="No expenses found" description="As employees start submitting claims they will appear here." />
      ) : (
        <ExpenseTable expenses={expensesQuery.data} />
      )}
    </PageShell>
  );
}
