import { apiClient } from "@/lib/api/client";
import type { Expense } from "@/types";

export async function getApprovalQueue() {
  const { data } = await apiClient.get("/approvals/queue/");
  return data as Expense[];
}
