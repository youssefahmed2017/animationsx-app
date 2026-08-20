"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LikeButton({
  slug,
  initiallyLiked,
  initialCount,
  signedIn,
}: {
  slug: string;
  initiallyLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/anim/${slug}`);
      return;
    }
    if (pending) return;
    setPending(true);

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const res = await fetch(`/api/animations/${slug}/like`, {
      method: nextLiked ? "POST" : "DELETE",
    });

    if (!res.ok) {
      // Revert the optimistic update.
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        liked
          ? "border-pink-800 bg-pink-950 text-pink-300"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
      }`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      {count}
    </button>
  );
}
