"use client";

import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { ExpenseTable } from "@/components/expense/expense-table";
import { useAuth } from "@/hooks/use-auth";
import { useExpenses } from "@/hooks/use-expenses";

export default function MyExpensesPage() {
  const { user } = useAuth();
  const expensesQuery = useExpenses();
  const myExpenses = (expensesQuery.data ?? []).filter((expense) => expense.user === user?.id);

  return (
    <PageShell eyebrow="My claims" title="Expense history" description="Track each claim from draft through reimbursement.">
      {!myExpenses.length ? (
        <EmptyState title="No personal expenses yet" description="Create your first draft to start the reimbursement flow." />
      ) : (
        <ExpenseTable expenses={myExpenses} detailPrefix="/me/expenses" />
      )}
    </PageShell>
  );
}
