"use client";

import { useQuery } from "@tanstack/react-query";
import { getApprovalQueue } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/query-keys";

export function useApprovalQueue() {
  return useQuery({
    queryKey: queryKeys.approvals.queue,
    queryFn: getApprovalQueue
  });
}
