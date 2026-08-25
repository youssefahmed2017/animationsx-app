"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_COMMENT_LENGTH = 1000;

export default function ReplyForm({
  slug,
  parentId,
  onDone,
}: {
  slug: string;
  parentId: string;
  onDone: () => void;
}) {
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
      body: JSON.stringify({ body, parentId }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }

    setBody("");
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-1.5">
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        rows={2}
        placeholder="Write a reply…"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-500"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="rounded-md bg-white text-neutral-900 font-medium transition-transform active:scale-95 px-2.5 py-1 text-xs disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Reply"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Cancel
        </button>
        {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
      </div>
    </form>
  );
}
