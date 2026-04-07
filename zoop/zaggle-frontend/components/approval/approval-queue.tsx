import { ExpenseTable } from "@/components/expense/expense-table";
import type { Expense } from "@/types";

export function ApprovalQueue({ expenses }: { expenses: Expense[] }) {
  return <ExpenseTable expenses={expenses} detailPrefix="/expenses" />;
}
