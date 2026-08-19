"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDebounced } from "@/lib/useDebounced";
import PasswordInput from "@/components/PasswordInput";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [done, setDone] = useState(false);

  // Only ever set from the async .then() below (never synchronously in the
  // effect body), and only trusted when it matches the current debounced
  // value — anything else renders as "checking" without needing its own state.
  const [usernameCheck, setUsernameCheck] = useState<{ username: string; taken: boolean } | null>(
    null
  );
  const debouncedUsername = useDebounced(username, 400);
  const isValidFormat = USERNAME_PATTERN.test(debouncedUsername);
  const supabase = createClient();

  useEffect(() => {
    if (!isValidFormat) return;

    let cancelled = false;
    supabase
      .from("profiles")
      .select("id")
      .eq("username", debouncedUsername)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setUsernameCheck({ username: debouncedUsername, taken: !!data });
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername, isValidFormat, supabase]);

  const usernameStatus = !isValidFormat
    ? null
    : usernameCheck?.username === debouncedUsername
    ? usernameCheck.taken
      ? "taken"
      : "available"
    : "checking";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-1">Check your email</h1>
        <p className="text-neutral-400 text-sm">
          We sent a confirmation link to {email}. Click it to activate your account, then come
          back and sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Create an account</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Publish and remix CSS-only animations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_-]+"
            title="3-24 characters: letters, numbers, _ or -"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          {usernameStatus === "checking" && (
            <p className="mt-1 text-xs text-neutral-500">Checking availability…</p>
          )}
          {usernameStatus === "available" && (
            <p className="mt-1 text-xs text-green-400">✓ Available</p>
          )}
          {usernameStatus === "taken" && (
            <p className="mt-1 text-xs text-red-400">✗ Already taken</p>
          )}
        </div>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <PasswordInput
          required
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="Password (min 8 characters)"
          minLength={8}
        />
        <button
          type="submit"
          disabled={submitting || usernameStatus === "taken"}
          className="w-full rounded-md bg-white text-neutral-900 font-medium py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
      </form>

      <p className="mt-4 text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="underline text-neutral-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
