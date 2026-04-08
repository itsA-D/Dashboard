"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/api/audit";
import { queryKeys } from "@/lib/query-keys";

export function useAuditLogs() {
  return useQuery({
    queryKey: queryKeys.audit.list,
    queryFn: listAuditLogs
  });
}
