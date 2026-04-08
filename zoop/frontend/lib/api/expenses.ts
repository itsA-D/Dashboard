import { apiClient } from "@/lib/api/client";
import type { Expense } from "@/types";

export async function listExpenses(params?: Record<string, string | undefined>) {
  const { data } = await apiClient.get("/expenses/", { params });
  return Array.isArray(data) ? (data as Expense[]) : ((data.results ?? data.data ?? []) as Expense[]);
}

export async function getExpense(id: string) {
  const { data } = await apiClient.get(`/expenses/${id}/`);
  return data as Expense;
}

export async function createExpense(payload: Record<string, unknown>) {
  const { data } = await apiClient.post("/expenses/", payload);
  return data as Expense;
}

export async function submitExpense(id: string) {
  const { data } = await apiClient.post(`/expenses/${id}/submit/`);
  return data as Expense;
}

export async function approveExpense(id: string, reason?: string) {
  const { data } = await apiClient.post(`/expenses/${id}/approve/`, reason ? { reason } : {});
  return data as Expense;
}

export async function rejectExpense(id: string, reason: string) {
  const { data } = await apiClient.post(`/expenses/${id}/reject/`, { reason });
  return data as Expense;
}

export async function requestReceiptUpload(contentType: string, expenseId?: string) {
  const { data } = await apiClient.post("/expenses/upload-receipt/", {
    content_type: contentType,
    expense_id: expenseId
  });
  return data as { upload_url: string; receipt_key: string };
}
