"use client";

import { useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import Avatar from "@/components/Avatar";
import { useToast } from "@/components/Toast";
import { MAX_BIO_LENGTH } from "@/lib/profileLimits";

export default function AccountForm({
  initialUsername,
  initialEmail,
  initialAvatarUrl,
  initialBio,
}: {
  initialUsername: string;
  initialEmail: string;
  initialAvatarUrl: string;
  initialBio: string;
}) {
  const { showToast } = useToast();

  const [username, setUsername] = useState(initialUsername);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const [email, setEmail] = useState(initialEmail);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [bio, setBio] = useState(initialBio);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handleAvatarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAvatarSaving(true);
    setAvatarError("");

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
    });
    const json = await res.json();
    setAvatarSaving(false);

    if (!res.ok) {
      setAvatarError(json.error ?? "Something went wrong.");
      return;
    }
    showToast("Avatar updated.");
  }

  async function handleBioSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBioSaving(true);
    setBioError("");

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    const json = await res.json();
    setBioSaving(false);

    if (!res.ok) {
      setBioError(json.error ?? "Something went wrong.");
      return;
    }
    showToast("Bio updated.");
  }

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameSaving(true);
    setUsernameError("");

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    setUsernameSaving(false);

    if (!res.ok) {
      setUsernameError(json.error ?? "Something went wrong.");
      return;
    }
    showToast("Username updated.");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailError("");

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    setEmailSaving(false);

    if (!res.ok) {
      setEmailError(json.error ?? "Something went wrong.");
      return;
    }
    showToast("Check your inbox to confirm the new email.");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");

    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    setPasswordSaving(false);

    if (!res.ok) {
      setPasswordError(json.error ?? "Something went wrong.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    showToast("Password updated.");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
      <h1 className="text-2xl font-semibold">Account settings</h1>

      <form onSubmit={handleAvatarSubmit} className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-300">Avatar</h2>
        <div className="flex items-center gap-3">
          <Avatar username={username} avatarUrl={avatarUrl} size={48} />
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={avatarSaving || avatarUrl === initialAvatarUrl}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
          >
            {avatarSaving ? "Saving…" : "Save"}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Paste a link to an image. Leave blank to use your initial instead.
        </p>
        {avatarError && <p className="text-sm text-red-400">{avatarError}</p>}
      </form>

      <form onSubmit={handleBioSubmit} className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Bio</h2>
          <span className="text-xs text-neutral-500">
            {bio.length} / {MAX_BIO_LENGTH}
          </span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO_LENGTH}
          rows={3}
          placeholder="Tell people what you make…"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={bioSaving || bio === initialBio}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
        >
          {bioSaving ? "Saving…" : "Save"}
        </button>
        {bioError && <p className="text-sm text-red-400">{bioError}</p>}
      </form>

      <form onSubmit={handleUsernameSubmit} className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-300">Username</h2>
        <div className="flex gap-2">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={usernameSaving || username === initialUsername}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
          >
            {usernameSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {usernameError && <p className="text-sm text-red-400">{usernameError}</p>}
      </form>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-300">Email</h2>
        <div className="flex gap-2">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={emailSaving || email === initialEmail}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
          >
            {emailSaving ? "Saving…" : "Save"}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Changing your email requires confirming from your inbox.
        </p>
        {emailError && <p className="text-sm text-red-400">{emailError}</p>}
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-300">Password</h2>
        <PasswordInput
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Current password"
          autoComplete="current-password"
          required
        />
        <PasswordInput
          value={newPassword}
          onChange={setNewPassword}
          placeholder="New password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={passwordSaving}
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
        >
          {passwordSaving ? "Updating…" : "Update password"}
        </button>
        {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
      </form>

      <div className="space-y-3 border-t border-neutral-800 pt-6">
        <h2 className="text-sm font-medium text-red-400">Danger zone</h2>
        <DeleteAccountButton username={username} />
      </div>
    </div>
  );
}
