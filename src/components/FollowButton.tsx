"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({
  username,
  initiallyFollowing,
  signedIn,
}: {
  username: string;
  initiallyFollowing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/u/${username}`);
      return;
    }
    if (pending) return;
    setPending(true);

    const nextFollowing = !following;
    setFollowing(nextFollowing);

    const res = await fetch(`/api/users/${username}/follow`, {
      method: nextFollowing ? "POST" : "DELETE",
    });

    if (!res.ok) {
      setFollowing(!nextFollowing);
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
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        following
          ? "border border-neutral-700 text-neutral-300 hover:border-red-800 hover:text-red-400"
          : "bg-white text-neutral-900 hover:bg-neutral-200"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
