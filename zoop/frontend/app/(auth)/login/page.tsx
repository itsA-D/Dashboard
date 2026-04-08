"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { requestOtp } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Use your company email to request a one-time code.");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-ember">Zoop access</p>
        <h1 className="mt-3 font-display text-4xl text-ink">Sign in with OTP</h1>
        <p className="mt-3 text-sm text-slate">{message}</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);

          try {
            const response = await requestOtp(email);
            sessionStorage.setItem("zoop_session_token", response.session_token);
            sessionStorage.setItem("zoop_email", email);
            router.push("/verify-otp");
          } catch (error) {
            console.error("OTP Request failed:", error);
            if (axios.isAxiosError(error)) {
              const apiMessage =
                (error.response?.data as { error?: { message?: string }; detail?: string } | undefined)?.error?.message ??
                (error.response?.data as { detail?: string } | undefined)?.detail;
              setMessage(apiMessage ? `OTP request failed: ${apiMessage}` : "OTP request failed. Ensure the backend is running at http://127.0.0.1:8000 and CORS is allowed.");
            } else {
              setMessage("OTP request failed. Confirm the connection and try again.");
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Email</span>
          <input className="min-h-12 w-full rounded-2xl border border-mist bg-paper px-4" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
        </label>
        <button className="min-h-12 w-full rounded-full bg-ink px-5 text-sm font-semibold text-white" disabled={loading}>
          {loading ? "Sending code..." : "Request OTP"}
        </button>
      </form>
    </div>
  );
}
