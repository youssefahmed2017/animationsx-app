"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GitHubIcon } from "@/components/icons";

export default function OAuthButtons({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = createClient();

  async function signInWithGitHub() {
    setLoading(true);
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/confirmed?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
    // On success the browser is redirected to GitHub, so no further local state change here.
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signInWithGitHub}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-neutral-700 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
      >
        <GitHubIcon />
        {loading ? "Redirecting…" : "Continue with GitHub"}
      </button>
      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      <div className="flex items-center gap-3 text-xs text-neutral-600">
        <div className="h-px flex-1 bg-neutral-800" />
        or
        <div className="h-px flex-1 bg-neutral-800" />
      </div>
    </div>
  );
}
