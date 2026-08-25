"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUpIcon } from "@/components/icons";

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
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-all duration-150 active:scale-90 disabled:opacity-50 disabled:active:scale-100 ${
        liked
          ? "border-blue-800 bg-blue-950 text-blue-300"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:scale-105"
      }`}
    >
      <ThumbsUpIcon filled={liked} className={liked ? "scale-110 transition-transform" : "transition-transform"} />
      {count}
    </button>
  );
}
