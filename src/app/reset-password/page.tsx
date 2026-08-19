"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // The recovery link's tokens are exchanged for a session automatically
    // by the browser client (detectSessionInUrl). Either this fires...
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // ...or a session already exists by the time we mount.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    await fetch("/api/auth/trust-device", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="text-neutral-400 text-sm">
          Open this page from the password reset link in your email.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Set a new password</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mt-6">
        <PasswordInput
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="New password (min 8 characters)"
          minLength={8}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-white text-neutral-900 font-medium py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save new password"}
        </button>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
      </form>
    </div>
  );
}
