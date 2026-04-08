"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCard, getCardTransactions, listCards, mutateCard, updateCardLimit } from "@/lib/api/cards";
import { queryKeys } from "@/lib/query-keys";

export function useCards() {
  return useQuery({
    queryKey: queryKeys.cards.list,
    queryFn: listCards
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => getCard(id),
    enabled: Boolean(id)
  });
}

export function useCardTransactions(id: string) {
  return useQuery({
    queryKey: queryKeys.cards.transactions(id),
    queryFn: () => getCardTransactions(id),
    enabled: Boolean(id)
  });
}

export function useCardAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "freeze" | "unfreeze" | "block" }) => mutateCard(id, action),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.list });
      queryClient.setQueryData(queryKeys.cards.detail(card.id), card);
    }
  });
}

export function useUpdateCardLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, monthly_limit, daily_limit }: { id: string; monthly_limit?: string; daily_limit?: string }) =>
      updateCardLimit(id, { monthly_limit, daily_limit }),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.list });
      queryClient.setQueryData(queryKeys.cards.detail(card.id), card);
    }
  });
}
