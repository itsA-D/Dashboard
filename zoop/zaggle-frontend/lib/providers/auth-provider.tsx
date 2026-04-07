"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { clearSessionTokens, getRefreshToken, setAccessToken, setRefreshToken } from "@/lib/auth";
import { fetchMe } from "@/lib/api/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setSession: (payload: { access: string; refresh: string; user: User }) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = getRefreshToken();
    if (!refresh) {
      setLoading(false);
      return;
    }

    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/v1/auth/token/refresh/`, {
        refresh
      })
      .then(async (response) => {
        setAccessToken(response.data.access);
        if (response.data.refresh) {
          setRefreshToken(response.data.refresh);
        }
        const nextUser = await fetchMe();
        setUser(nextUser);
      })
      .catch(() => {
        clearSessionTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setSession: (payload) => {
        setAccessToken(payload.access);
        setRefreshToken(payload.refresh);
        setUser(payload.user);
        setLoading(false);
      },
      clearSession: () => {
        clearSessionTokens();
        setUser(null);
        router.push("/login");
      }
    }),
    [loading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return value;
}
