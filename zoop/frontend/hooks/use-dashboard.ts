"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { generateReport, getDashboardAnalytics, getReport } from "@/lib/api/reports";

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics,
    queryFn: getDashboardAnalytics
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: generateReport
  });
}

export function useReport(reportId: string | null) {
  return useQuery({
    queryKey: queryKeys.reports.detail(reportId),
    queryFn: () => getReport(reportId as string),
    enabled: Boolean(reportId),
    refetchInterval: (query) => (query.state.data?.status === "ready" ? false : 3000)
  });
}
