"use client";

import { useState } from "react";
import { diffLines } from "diff";

export default function CssDiff({
  originalCss,
  forkedCss,
  originalTitle,
}: {
  originalCss: string;
  forkedCss: string;
  originalTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const parts = open ? diffLines(originalCss, forkedCss) : [];

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-neutral-300 underline"
      >
        {open ? "Hide" : "View"} diff from {originalTitle}
      </button>

      {open && (
        <pre className="mt-2 rounded-md border border-neutral-800 bg-neutral-900 p-3 text-xs overflow-x-auto whitespace-pre-wrap">
          {parts.map((part, i) => (
            <span
              key={i}
              className={
                part.added
                  ? "block bg-green-950 text-green-400"
                  : part.removed
                  ? "block bg-red-950 text-red-400 line-through"
                  : "block text-neutral-400"
              }
            >
              {part.value}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}
