"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmedInner />
    </Suspense>
  );
}

function AuthConfirmedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const supabase = createClient();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      // The confirmation link's tokens (or an OAuth provider's ?code=) are
      // exchanged for a session automatically by the browser client
      // (detectSessionInUrl).
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setErrorMessage("This confirmation link is invalid or has expired.");
        return;
      }

      // Clicking the emailed link (or completing an OAuth flow) already
      // proves device + email ownership, so trust this device the same as
      // a device-confirmation code would.
      await fetch("/api/auth/trust-device", { method: "POST" });
      if (!cancelled) {
        router.push(next);
        router.refresh();
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router, supabase, next]);

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
