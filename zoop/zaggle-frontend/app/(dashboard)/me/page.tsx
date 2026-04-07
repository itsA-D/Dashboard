"use client";

import Link from "next/link";
import { CardWidget } from "@/components/card/card-widget";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { StatCard } from "@/components/common/stat-card";
import { ExpenseTable } from "@/components/expense/expense-table";
import { useCards } from "@/hooks/use-cards";
import { useExpenses } from "@/hooks/use-expenses";
import { useAuth } from "@/hooks/use-auth";

export default function MePage() {
  const { user } = useAuth();
  const expensesQuery = useExpenses();
  const cardsQuery = useCards();
  const myExpenses = (expensesQuery.data ?? []).filter((expense) => expense.user === user?.id);
  const myCard = (cardsQuery.data ?? []).find((card) => card.user === user?.id);

  return (
    <PageShell
      eyebrow="Employee self-service"
      title={`Evening check-in, ${user?.full_name?.split(" ")[0] ?? "employee"}`}
      description="A mobile-first surface for balancing card access, recent claims, and quick submission."
      actions={
        <Link className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white" href="/me/expenses/new">
          Submit expense
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="My expenses" value={myExpenses.length} />
        <StatCard label="Pending claims" value={myExpenses.filter((expense) => expense.status !== "approved").length} tone="ember" />
        <StatCard label="Approved claims" value={myExpenses.filter((expense) => expense.status === "approved").length} tone="moss" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {myCard ? <CardWidget card={myCard} /> : <EmptyState title="No card assigned" description="Your company card will appear here once finance issues it." />}
        <div className="rounded-[1.75rem] border border-white/60 bg-white/85 p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-ink">Recent expenses</h2>
          <ExpenseTable expenses={myExpenses.slice(0, 5)} detailPrefix="/me/expenses" />
        </div>
      </div>
    </PageShell>
  );
}
