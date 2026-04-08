import { SimpleTable } from "@/components/common/simple-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Budget } from "@/types";

export function BudgetTable({ budgets }: { budgets: Budget[] }) {
  return (
    <SimpleTable
      columns={["Department", "Category", "Period", "Amount", "Start", "Threshold"]}
      rows={budgets.map((budget) => [
        budget.department,
        budget.category || "All",
        budget.period,
        formatCurrency(budget.amount),
        formatDate(budget.period_start),
        `${budget.alert_threshold}%`
      ])}
    />
  );
}
