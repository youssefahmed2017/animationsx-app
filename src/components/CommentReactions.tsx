"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_REACTIONS, type ReactionEmoji } from "@/lib/reactions";

export type ReactionCounts = Partial<Record<ReactionEmoji, { count: number; reactedByMe: boolean }>>;

export default function CommentReactions({
  commentId,
  initialReactions,
  signedIn,
}: {
  commentId: string;
  initialReactions: ReactionCounts;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [reactions, setReactions] = useState(initialReactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<ReactionEmoji | null>(null);

  async function toggle(emoji: ReactionEmoji) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    if (pending) return;
    setPending(emoji);

    const current = reactions[emoji];
    const nextReacted = !current?.reactedByMe;
    setReactions((r) => ({
      ...r,
      [emoji]: {
        count: (current?.count ?? 0) + (nextReacted ? 1 : -1),
        reactedByMe: nextReacted,
      },
    }));
    setPickerOpen(false);

    const res = await fetch(`/api/comments/${commentId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });

    if (!res.ok) {
      setReactions((r) => ({
        ...r,
        [emoji]: { count: current?.count ?? 0, reactedByMe: !!current?.reactedByMe },
      }));
    }
    setPending(null);
  }

  const active = ALLOWED_REACTIONS.filter((e) => (reactions[e]?.count ?? 0) > 0);
  const unused = ALLOWED_REACTIONS.filter((e) => !(reactions[e]?.count ?? 0));

  return (
    <div className="flex items-center gap-1 mt-1.5 relative">
      {active.map((emoji) => {
        const r = reactions[emoji]!;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            disabled={pending === emoji}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs disabled:opacity-50 ${
              r.reactedByMe
                ? "border-blue-800 bg-blue-950"
                : "border-neutral-700 hover:border-neutral-500"
            }`}
          >
            <span>{emoji}</span>
            <span className="text-neutral-400">{r.count}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setPickerOpen((o) => !o)}
        className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
      >
        +
      </button>

      {pickerOpen && (
        <div className="absolute left-0 top-6 z-10 flex gap-1 rounded-md border border-neutral-700 bg-neutral-900 p-1.5 shadow-lg">
          {unused.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              className="rounded px-1.5 py-0.5 text-sm hover:bg-neutral-800"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
