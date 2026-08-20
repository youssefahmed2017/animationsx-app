"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_COMMENT_LENGTH = 1000;

export default function AddCommentForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const res = await fetch(`/api/animations/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        placeholder="Add a comment…"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="rounded-md bg-white text-neutral-900 font-medium px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Comment"}
        </button>
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
      </div>
    </form>
  );
}
