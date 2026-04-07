"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpensePolicy,
  getCompanySettings,
  getMyCompany,
  listExpensePolicies,
  updateCompanySettings,
  updateExpensePolicy
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/query-keys";

export function useMyCompany() {
  return useQuery({
    queryKey: queryKeys.settings.company,
    queryFn: getMyCompany
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: queryKeys.settings.companySettings,
    queryFn: getCompanySettings
  });
}

export function useExpensePolicies() {
  return useQuery({
    queryKey: queryKeys.settings.expensePolicies,
    queryFn: listExpensePolicies
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.companySettings });
    }
  });
}

export function useCreateExpensePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpensePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.expensePolicies });
    }
  });
}

export function useToggleExpensePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateExpensePolicy(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.expensePolicies });
    }
  });
}