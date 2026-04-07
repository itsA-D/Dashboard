import { apiClient } from "@/lib/api/client";
import type { Card, CardTransaction } from "@/types";

export async function listCards() {
  const { data } = await apiClient.get("/cards/");
  return Array.isArray(data) ? (data as Card[]) : ((data.results ?? data.data ?? []) as Card[]);
}

export async function getCard(id: string) {
  const { data } = await apiClient.get(`/cards/${id}/`);
  return data as Card;
}

export async function getCardTransactions(id: string) {
  const { data } = await apiClient.get(`/cards/${id}/transactions/`);
  return Array.isArray(data) ? (data as CardTransaction[]) : ((data.results ?? data.data ?? []) as CardTransaction[]);
}

export async function mutateCard(id: string, action: "freeze" | "unfreeze" | "block", payload?: Record<string, unknown>) {
  const { data } = await apiClient.post(`/cards/${id}/${action}/`, payload ?? {});
  return data as Card;
}

export async function updateCardLimit(id: string, payload: { monthly_limit?: string; daily_limit?: string }) {
  const { data } = await apiClient.post(`/cards/${id}/update_limit/`, payload);
  return data as Card;
}
