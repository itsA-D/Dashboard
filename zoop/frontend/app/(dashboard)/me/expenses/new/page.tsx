"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/common/page-shell";
import { ExpenseForm } from "@/components/expense/expense-form";
import { ReceiptUploader } from "@/components/expense/receipt-uploader";
import { useCreateExpense, useSubmitExpense } from "@/hooks/use-expenses";
import type { ExpenseFormValues } from "@/schemas/expense-schema";

export default function NewExpensePage() {
  const router = useRouter();
  const [receiptKey, setReceiptKey] = useState<string>("");
  const createMutation = useCreateExpense();
  const submitMutation = useSubmitExpense();

  async function handleCreate(values: ExpenseFormValues) {
    createMutation.mutate(
      { ...values, receipt_key: receiptKey || values.receipt_key },
      {
        onSuccess: (expense) => {
          submitMutation.mutate(expense.id, {
            onSuccess: (submitted) => router.push(`/me/expenses/${submitted.id}`)
          });
        }
      }
    );
  }

  return (
    <PageShell eyebrow="Submission flow" title="Create a new expense" description="Upload a receipt, confirm the details, and send the claim into the approval engine.">
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <ReceiptUploader onUploaded={setReceiptKey} />
        <ExpenseForm onSubmit={handleCreate} receiptKey={receiptKey} submitting={createMutation.isPending || submitMutation.isPending} />
      </div>
    </PageShell>
  );
}
