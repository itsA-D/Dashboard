import { cn, formatCurrency } from "@/lib/utils";
import type { BudgetUtilisation } from "@/types";

export function BudgetProgressCard({ budget }: { budget: BudgetUtilisation }) {
  const percentage = Number(budget.utilisation_pct);

  return (
    <div className="rounded-[1.5rem] border border-white/60 bg-white/85 p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate">{budget.period}</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{budget.department}</h3>
          <p className="text-sm text-slate">{budget.category || "All categories"}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(budget.status))}>{budget.status}</span>
      </div>
      <div className="mt-5 h-3 rounded-full bg-mist">
        <div className={cn("h-3 rounded-full", barClass(budget.status))} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate">
        <span>{formatCurrency(budget.spent)} spent</span>
        <span>{formatCurrency(budget.budget_amount)} total</span>
      </div>
    </div>
  );
}

function statusClass(status: BudgetUtilisation["status"]) {
  if (status === "critical") return "bg-rose-100 text-rose-700";
  if (status === "warning") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function barClass(status: BudgetUtilisation["status"]) {
  if (status === "critical") return "bg-rose-500";
  if (status === "warning") return "bg-amber-500";
  return "bg-moss";
}
