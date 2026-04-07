"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useApproveExpense, useRejectExpense } from "@/hooks/use-expenses";
import type { Expense } from "@/types";

export function ApprovalActionBar({ expense }: { expense: Expense }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const approveMutation = useApproveExpense();
  const rejectMutation = useRejectExpense();
  const canApproveRole = user?.role === "admin" || user?.role === "finance" || user?.role === "manager";
  const isPending = expense.status === "submitted" || expense.status === "pending_approval";

  if (!user || !canApproveRole || expense.user === user.id || !isPending) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-10 rounded-[1.5rem] border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Approval action</p>
          <p className="text-sm text-slate">Step {expense.current_step ?? 0} of {expense.total_steps ?? 0}</p>
        </div>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="min-h-11 rounded-full border border-mist bg-paper px-4 py-2 text-sm outline-none"
          placeholder="Optional review note"
        />
        <button onClick={() => approveMutation.mutate({ id: expense.id, reason })} className="min-h-11 rounded-full bg-moss px-5 text-sm font-semibold text-white">
          {approveMutation.isPending ? "Approving..." : "Approve"}
        </button>
        <button
          disabled={rejectMutation.isPending}
          onClick={() => rejectMutation.mutate({ id: expense.id, reason: reason || "Rejected during review" })}
          className="min-h-11 rounded-full bg-ember px-5 text-sm font-semibold text-white"
        >
          {rejectMutation.isPending ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
