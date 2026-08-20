"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Item = { slug: string; title: string; category: string };

export default function SidebarAnimationList({
  animations,
  username,
}: {
  animations: Item[];
  username: string;
}) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return animations;
    return animations.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [filter, animations]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-neutral-300">Your animations</h2>
        <span className="text-xs text-neutral-500">{animations.length}</span>
      </div>

      {animations.length === 0 ? (
        <p className="text-neutral-500 text-sm">You haven&apos;t published anything yet.</p>
      ) : (
        <>
          {animations.length > 5 && (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Find an animation…"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500 mb-2"
            />
          )}
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {filtered.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/anim/${a.slug}`}
                  className="block rounded-md px-2 py-1.5 hover:bg-neutral-900"
                >
                  <span className="block text-sm text-neutral-200">{a.title}</span>
                  <span className="block text-xs text-neutral-500">{a.category}</span>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-sm text-neutral-500 px-2 py-1.5">No matches.</li>
            )}
          </ul>
        </>
      )}

      <Link
        href={`/u/${username}`}
        className="inline-block mt-2 text-xs text-neutral-400 hover:text-neutral-200 underline"
      >
        View all →
      </Link>
    </div>
  );
}
