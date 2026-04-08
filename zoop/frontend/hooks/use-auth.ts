"use client";

import { useAuthContext } from "@/lib/providers/auth-provider";

export function useAuth() {
  return useAuthContext();
}
