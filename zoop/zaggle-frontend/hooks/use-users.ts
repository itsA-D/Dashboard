"use client";

import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: listUsers
  });
}
