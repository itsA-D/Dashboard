import { apiClient } from "@/lib/api/client";
import type { AuditLog } from "@/types";

export async function listAuditLogs() {
  const { data } = await apiClient.get("/audit/");
  return Array.isArray(data) ? (data as AuditLog[]) : ((data.results ?? data.data ?? []) as AuditLog[]);
}
