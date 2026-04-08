"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormValues } from "@/schemas/expense-schema";

export function ExpenseForm({
  onSubmit,
  submitting,
  initialValues,
  receiptKey
}: {
  onSubmit: (values: ExpenseFormValues) => void;
  submitting: boolean;
  initialValues?: Partial<ExpenseFormValues>;
  receiptKey?: string;
}) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: initialValues?.amount ?? 0,
      expense_date: initialValues?.expense_date ?? new Date().toISOString().slice(0, 10),
      merchant_name: initialValues?.merchant_name ?? "",
      category: initialValues?.category ?? "travel",
      description: initialValues?.description ?? "",
      merchant_mcc: initialValues?.merchant_mcc ?? "",
      receipt_key: receiptKey ?? initialValues?.receipt_key ?? ""
    }
  });

  return (
    <form
      className="grid gap-4 rounded-[1.75rem] border border-white/60 bg-white/85 p-6 shadow-card"
      onSubmit={form.handleSubmit((values) => onSubmit({ ...values, receipt_key: receiptKey ?? values.receipt_key }))}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount">
          <input type="number" step="0.01" className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" {...form.register("amount")} />
        </Field>
        <Field label="Expense date">
          <input type="date" className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" {...form.register("expense_date")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Merchant">
          <input className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" {...form.register("merchant_name")} />
        </Field>
        <Field label="Category">
          <select className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" {...form.register("category")}>
            {["travel", "meals", "fuel", "accommodation", "medical", "telecom", "other"].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea rows={4} className="w-full rounded-2xl border border-mist bg-paper px-4 py-3" {...form.register("description")} />
      </Field>
      <button className="min-h-12 rounded-full bg-ink px-5 text-sm font-semibold text-white" disabled={submitting} type="submit">
        {submitting ? "Saving..." : "Create draft expense"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate">{label}</span>
      {children}
    </label>
  );
}
