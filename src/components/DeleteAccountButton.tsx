"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function DeleteAccountButton({ username }: { username: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setErrorMessage("");

    const res = await fetch("/api/account", { method: "DELETE" });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErrorMessage(json.error ?? "Failed to delete account.");
      setDeleting(false);
      return;
    }

    await createClient().auth.signOut();
    showToast("Account deleted.");
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-900 text-red-400 px-3 py-1.5 text-sm hover:border-red-700"
      >
        Delete account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => !deleting && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-5"
          >
            <h2 id="delete-account-dialog-title" className="text-lg font-semibold mb-2">
              Delete your account?
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              This permanently deletes your profile and every animation you&apos;ve published,
              including their CSS files in the registry. This can&apos;t be undone.
            </p>
            <label className="block text-sm text-neutral-400 mb-1">
              Type <span className="font-mono text-neutral-200">{username}</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500 mb-4"
            />
            {errorMessage && <p className="text-sm text-red-400 mb-3">{errorMessage}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || confirmText !== username}
                className="rounded-md bg-red-900 text-red-100 px-3 py-1.5 text-sm hover:bg-red-800 disabled:opacity-50 disabled:hover:bg-red-900"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
