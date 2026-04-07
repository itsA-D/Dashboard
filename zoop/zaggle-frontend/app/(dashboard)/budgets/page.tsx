"use client";

import { useState } from "react";
import { BudgetProgressCard } from "@/components/budget/budget-progress-card";
import { BudgetTable } from "@/components/budget/budget-table";
import { DataPanel } from "@/components/common/data-panel";
import { PageShell } from "@/components/common/page-shell";
import { useBudgetUtilisation, useBudgets, useCreateBudget } from "@/hooks/use-budgets";

export default function BudgetsPage() {
  const [department, setDepartment] = useState("");
  const [amount, setAmount] = useState("");
  const budgetsQuery = useBudgets();
  const utilisationQuery = useBudgetUtilisation();
  const createMutation = useCreateBudget();

  return (
    <PageShell eyebrow="Budget tracker" title="Department controls" description="Track thresholds and create fresh budget envelopes without leaving the dashboard.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {utilisationQuery.data?.map((budget) => (
          <BudgetProgressCard key={`${budget.department}-${budget.category}-${budget.period}`} budget={budget} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <DataPanel title="Existing budgets">
          <BudgetTable budgets={budgetsQuery.data ?? []} />
        </DataPanel>
        <DataPanel title="Create budget" subtitle="A lightweight finance workflow wired to the backend create endpoint">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate({
                department,
                amount,
                category: "",
                period: "monthly",
                period_start: new Date().toISOString().slice(0, 10),
                alert_threshold: "80"
              });
            }}
          >
            <input className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" onChange={(event) => setDepartment(event.target.value)} placeholder="Department" value={department} />
            <input className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" onChange={(event) => setAmount(event.target.value)} placeholder="Amount" type="number" value={amount} />
            <button className="min-h-12 w-full rounded-full bg-ink px-5 text-sm font-semibold text-white">
              {createMutation.isPending ? "Creating..." : "Create budget"}
            </button>
          </form>
        </DataPanel>
      </div>
    </PageShell>
  );
}
