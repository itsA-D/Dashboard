import { cn } from "@/lib/utils";
import type { Expense } from "@/types";

const statusConfig: Record<Expense["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-sky-100 text-sky-700",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-rose-100 text-rose-700",
  reimbursed: "bg-violet-100 text-violet-700"
};

export function ExpenseStatusBadge({ status }: { status: Expense["status"] }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize", statusConfig[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
