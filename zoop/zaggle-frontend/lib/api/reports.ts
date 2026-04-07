import { apiClient } from "@/lib/api/client";
import type { DashboardAnalytics } from "@/types";

export async function getDashboardAnalytics() {
  const { data } = await apiClient.get("/reports/analytics/dashboard/");
  return (data.data ?? data) as DashboardAnalytics;
}

export async function generateReport(payload: Record<string, string>) {
  const { data } = await apiClient.post("/reports/generate/", payload);
  return data as { report_id: string; status: string };
}

export async function getReport(id: string) {
  const { data } = await apiClient.get(`/reports/${id}/download/`);
  return data as { status: string; content?: string };
}
