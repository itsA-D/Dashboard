import { apiClient } from "@/lib/api/client";
import type { NotificationItem } from "@/types";

export async function listNotifications() {
  const { data } = await apiClient.get("/notifications/");
  return Array.isArray(data) ? (data as NotificationItem[]) : ((data.results ?? data.data ?? []) as NotificationItem[]);
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.post(`/notifications/${id}/read/`);
  return data as NotificationItem;
}

export async function readAllNotifications() {
  const { data } = await apiClient.post("/notifications/read-all/");
  return data as { success: boolean; updated: number };
}
