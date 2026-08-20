"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCommentButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
