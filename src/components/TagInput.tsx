"use client";

import { useState } from "react";

export default function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const tag = draft.trim();
    setDraft("");
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
      return;
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.querySelector("input")?.focus();
      }}
      className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm outline-none focus-within:border-neutral-500 flex flex-wrap items-center gap-1.5"
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove tag ${tag}`}
            className="text-neutral-400 hover:text-neutral-100"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={tags.length === 0 ? placeholder : undefined}
        className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-neutral-500"
      />
    </div>
  );
}
