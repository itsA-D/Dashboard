"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { ExpenseDetail } from "@/components/expense/expense-detail";
import { useExpense } from "@/hooks/use-expenses";

export default function MyExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const expenseQuery = useExpense(params.id);

  useEffect(() => {
    const expense = expenseQuery.data;
    if (!expense) {
      return;
    }

    const hasReceipt = Boolean(expense.receipt_key);
    const hasOcrData = Boolean(expense.ocr_data && Object.keys(expense.ocr_data).length > 0);
    const shouldPoll = expense.status === "draft" && hasReceipt && !hasOcrData;
    if (!shouldPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      expenseQuery.refetch();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [expenseQuery.data, expenseQuery.refetch]);

  if (!expenseQuery.data) {
    return <div className="text-sm text-slate">Loading expense...</div>;
  }

  return (
    <PageShell eyebrow="Personal claim" title={expenseQuery.data.merchant_name || "Expense detail"} description="Your submission and approval trail in one place.">
      <ExpenseDetail expense={expenseQuery.data} />
    </PageShell>
  );
}
