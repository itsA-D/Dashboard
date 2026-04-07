"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead, readAllNotifications } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: listNotifications,
    refetchInterval: 30_000
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
  });
}

export function useReadAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readAllNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
  });
}
