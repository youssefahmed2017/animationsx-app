"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      // The confirmation link's tokens are exchanged for a session
      // automatically by the browser client (detectSessionInUrl).
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setErrorMessage("This confirmation link is invalid or has expired.");
        return;
      }

      // Clicking the emailed link already proves device + email ownership,
      // so trust this device the same as a device-confirmation code would.
      await fetch("/api/auth/trust-device", { method: "POST" });
      if (!cancelled) {
        router.push("/");
        router.refresh();
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      {errorMessage ? (
        <p className="text-sm text-red-400">{errorMessage}</p>
      ) : (
        <p className="text-neutral-400 text-sm">Confirming your account…</p>
      )}
    </div>
  );
}
