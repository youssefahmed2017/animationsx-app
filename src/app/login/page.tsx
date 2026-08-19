"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import OtpInput from "@/components/OtpInput";

const RESEND_COOLDOWN_SECONDS = 30;
const RATE_LIMITED_COOLDOWN_SECONDS = 90;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [stage, setStage] = useState<"credentials" | "confirm-device">("credentials");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isOnCooldown = resendCooldown > 0;
  useEffect(() => {
    if (!isOnCooldown) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnCooldown]);

  /** Posts credentials, moving to the confirm-device stage if a code was
   * sent, or redirecting straight in if this device is already trusted.
   * Used for both the initial sign-in attempt and "Resend code". */
  async function sendOtp(): Promise<boolean> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      setErrorMessage(json.error ?? "Something went wrong.");
      setResendCooldown(json.rateLimited ? RATE_LIMITED_COOLDOWN_SECONDS : RESEND_COOLDOWN_SECONDS);
      return false;
    }

    if (json.requiresConfirmation) {
      setEmailHint(json.emailHint ?? "");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStage("confirm-device");
      return true;
    }

    // Trusted device: signInWithPassword already established the session.
    router.push(next);
    router.refresh();
    return true;
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    await sendOtp();
    setSubmitting(false);
  }

  async function handleResend() {
    setResending(true);
    setErrorMessage("");
    setInfoMessage("");
    setCode("");

    const ok = await sendOtp();
    setResending(false);
    if (ok) setInfoMessage("A new code is on its way.");
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const res = await fetch("/api/auth/confirm-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, code }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (stage === "confirm-device") {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-semibold mb-1">Confirm this device</h1>
        <p className="text-neutral-400 text-sm mb-6">
          We sent a 6-digit code to {emailHint || "your email"} since we don&apos;t recognize
          this device.
        </p>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <OtpInput value={code} onChange={setCode} autoFocus />
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-md bg-white text-neutral-900 font-medium py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Confirming…" : "Confirm"}
          </button>
          {errorMessage && <p className="text-sm text-red-400 text-center">{errorMessage}</p>}
          {!errorMessage && infoMessage && (
            <p className="text-sm text-green-400 text-center">{infoMessage}</p>
          )}
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            onClick={() => {
              setStage("credentials");
              setCode("");
              setErrorMessage("");
              setInfoMessage("");
            }}
            className="text-neutral-400 underline"
          >
            Back to sign in
          </button>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-neutral-400 underline disabled:no-underline disabled:text-neutral-600"
          >
            {resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : resending
              ? "Sending…"
              : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
      <p className="text-neutral-400 text-sm mb-6">
        New devices need an extra emailed code to confirm it&apos;s really you.
      </p>

      <form onSubmit={handleCredentialsSubmit} className="space-y-3">
        <input
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <PasswordInput
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-white text-neutral-900 font-medium py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/signup" className="underline text-neutral-300">
          Create an account
        </Link>
        <Link href="/forgot-password" className="underline text-neutral-500">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
