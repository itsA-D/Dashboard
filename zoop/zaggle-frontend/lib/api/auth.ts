import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";

export async function requestOtp(email: string) {
  const { data } = await apiClient.post("/auth/login/", { email });
  return data as { session_token: string };
}

export async function verifyOtp(sessionToken: string, otp: string) {
  const { data } = await apiClient.post("/auth/verify-otp/", {
    session_token: sessionToken,
    otp
  });

  return data as {
    access: string;
    refresh: string;
    user: User;
  };
}

export async function fetchMe() {
  const { data } = await apiClient.get("/auth/me/");
  return data as User;
}

export async function logout(refresh: string) {
  await apiClient.post("/auth/logout/", { refresh });
}
