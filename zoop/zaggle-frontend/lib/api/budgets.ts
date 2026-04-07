import { apiClient } from "@/lib/api/client";
import type { Budget, BudgetUtilisation } from "@/types";

export async function listBudgets() {
  const { data } = await apiClient.get("/budgets/");
  return Array.isArray(data) ? (data as Budget[]) : ((data.results ?? data.data ?? []) as Budget[]);
}

export async function createBudget(payload: Record<string, string>) {
  const { data } = await apiClient.post("/budgets/", payload);
  return data as Budget;
}

export async function getBudgetUtilisation() {
  const { data } = await apiClient.get("/budgets/utilisation/");
  return (data.data ?? data.results ?? data) as BudgetUtilisation[];
}
