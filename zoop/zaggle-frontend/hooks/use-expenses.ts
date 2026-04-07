"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { approveExpense, createExpense, getExpense, listExpenses, rejectExpense, submitExpense } from "@/lib/api/expenses";

export function useExpenses(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: () => listExpenses(filters)
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => getExpense(id),
    enabled: Boolean(id)
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    }
  });
}

export function useSubmitExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitExpense,
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.setQueryData(queryKeys.expenses.detail(expense.id), expense);
    }
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => approveExpense(id, reason),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.queue });
      queryClient.setQueryData(queryKeys.expenses.detail(expense.id), expense);
    }
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectExpense(id, reason),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.queue });
      queryClient.setQueryData(queryKeys.expenses.detail(expense.id), expense);
    }
  });
}
