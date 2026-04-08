"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { verifyOtp } from "@/lib/api/auth";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSessionToken(sessionStorage.getItem("zoop_session_token") ?? "");
    setEmail(sessionStorage.getItem("zoop_email") ?? "");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-ember">Verification</p>
        <h1 className="mt-3 font-display text-4xl text-ink">Enter your code</h1>
        <p className="mt-3 text-sm text-slate">We sent a 6-digit code to {email || "your email"}.</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");

          const normalizedOtp = otp.replace(/\D/g, "");
          if (!sessionToken) {
            setError("Session expired. Request a new OTP.");
            return;
          }
          if (normalizedOtp.length !== 6) {
            setError("Enter a valid 6-digit OTP.");
            return;
          }

          try {
            const response = await verifyOtp(sessionToken, normalizedOtp);
            setSession(response);
            sessionStorage.removeItem("zoop_session_token");
            sessionStorage.removeItem("zoop_email");
            const path = response.user.role === "employee" ? "/me" : response.user.role === "manager" ? "/approvals" : "/dashboard";
            router.push(path);
          } catch (error) {
            if (axios.isAxiosError(error)) {
              const apiMessage = error.response?.data?.error?.message ?? error.response?.data?.detail;
              setError(apiMessage ? `OTP verification failed: ${apiMessage}` : "OTP verification failed.");
              return;
            }
            setError("OTP verification failed.");
          }
        }}
      >
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Code</span>
          <input
            className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4 tracking-[0.5em]"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            value={otp}
          />
        </label>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button className="min-h-12 w-full rounded-full bg-ink px-5 text-sm font-semibold text-white">Verify and continue</button>
      </form>
    </div>
  );
}
