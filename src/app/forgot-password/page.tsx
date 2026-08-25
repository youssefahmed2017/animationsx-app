"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Reset your password</h1>
      <p className="text-neutral-400 text-sm mb-6">
        We&apos;ll email you a link to set a new password.
      </p>

      {status === "sent" ? (
        <p className="text-sm text-green-400">Check {email} for a reset link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-md bg-white text-neutral-900 font-medium transition-transform active:scale-95 py-2 text-sm disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send reset link"}
          </button>
          {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}
        </form>
      )}
    </div>
  );
}
