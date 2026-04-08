import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";

export async function listUsers() {
  const { data } = await apiClient.get("/users/users/");
  return Array.isArray(data) ? (data as User[]) : ((data.results ?? data.data ?? []) as User[]);
}
