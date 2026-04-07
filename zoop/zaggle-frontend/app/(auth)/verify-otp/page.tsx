"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    setSessionToken(sessionStorage.getItem("zaggle_session_token") ?? "");
    setEmail(sessionStorage.getItem("zaggle_email") ?? "");
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

          try {
            const response = await verifyOtp(sessionToken, otp);
            setSession(response);
            sessionStorage.removeItem("zaggle_session_token");
            sessionStorage.removeItem("zaggle_email");
            const path = response.user.role === "employee" ? "/me" : response.user.role === "manager" ? "/approvals" : "/dashboard";
            router.push(path);
          } catch {
            setError("OTP verification failed.");
          }
        }}
      >
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Code</span>
          <input className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4 tracking-[0.5em]" maxLength={6} onChange={(event) => setOtp(event.target.value)} value={otp} />
        </label>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button className="min-h-12 w-full rounded-full bg-ink px-5 text-sm font-semibold text-white">Verify and continue</button>
      </form>
    </div>
  );
}
