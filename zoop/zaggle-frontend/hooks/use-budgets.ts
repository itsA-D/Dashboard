"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBudget, getBudgetUtilisation, listBudgets } from "@/lib/api/budgets";
import { queryKeys } from "@/lib/query-keys";

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets.list,
    queryFn: listBudgets
  });
}

export function useBudgetUtilisation() {
  return useQuery({
    queryKey: queryKeys.budgets.utilisation,
    queryFn: getBudgetUtilisation
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.utilisation });
    }
  });
}
