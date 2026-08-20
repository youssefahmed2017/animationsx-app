"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon } from "@/components/icons";

export default function FavoriteButton({
  slug,
  initiallyFavorited,
  signedIn,
}: {
  slug: string;
  initiallyFavorited: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/anim/${slug}`);
      return;
    }
    if (pending) return;
    setPending(true);

    const nextFavorited = !favorited;
    setFavorited(nextFavorited);

    const res = await fetch(`/api/animations/${slug}/favorite`, {
      method: nextFavorited ? "POST" : "DELETE",
    });

    if (!res.ok) {
      setFavorited(!nextFavorited);
    } else {
      router.refresh();
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
      className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        favorited
          ? "border-amber-800 bg-amber-950 text-amber-300"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
      }`}
    >
      <BookmarkIcon filled={favorited} />
    </button>
  );
}
