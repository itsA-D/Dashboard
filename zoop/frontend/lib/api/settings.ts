import { apiClient } from "@/lib/api/client";
import type { Company, CompanySettings, ExpensePolicy } from "@/types";

export async function getMyCompany() {
  const { data } = await apiClient.get("/companies/");
  const companies = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
  return (companies[0] ?? null) as Company | null;
}

export async function getCompanySettings() {
  const { data } = await apiClient.get("/companies/settings/");
  return data as CompanySettings;
}

export async function updateCompanySettings(payload: Partial<CompanySettings>) {
  const { data } = await apiClient.patch("/companies/settings/", payload);
  return data as CompanySettings;
}

export async function listExpensePolicies() {
  const { data } = await apiClient.get("/expenses/policies/");
  return Array.isArray(data) ? (data as ExpensePolicy[]) : ((data.results ?? data.data ?? []) as ExpensePolicy[]);
}

export async function createExpensePolicy(payload: {
  policy_type: string;
  applies_to_role?: string;
  applies_to_category?: string;
  value: Record<string, unknown>;
  description?: string;
}) {
  const { data } = await apiClient.post("/expenses/policies/", payload);
  return data as ExpensePolicy;
}

export async function updateExpensePolicy(id: string, payload: Partial<ExpensePolicy>) {
  const { data } = await apiClient.patch(`/expenses/policies/${id}/`, payload);
  return data as ExpensePolicy;
}