"use client";

import { useMemo, useState } from "react";

/**
 * Multi-tag picker for the (plain HTML GET) browse filter form. Mirrors
 * TagInput's chip UI but adds autocomplete against known tags and mirrors
 * its selection into a hidden input so the native form submit still works
 * with no JS.
 */
export default function TagFilterInput({
  name,
  initialTags,
  suggestions,
  placeholder,
}: {
  name: string;
  initialTags: string[];
  suggestions: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter((t) => t.toLowerCase().includes(q) && !tags.includes(t))
      .slice(0, 8);
  }, [draft, suggestions, tags]);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setDraft("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(matches[0] ?? draft);
      return;
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={tags.join(",")} />
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.querySelector("input")?.focus();
        }}
        className="min-w-[14rem] rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm outline-none focus-within:border-neutral-500 flex flex-wrap items-center gap-1.5"
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
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : undefined}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-neutral-500"
        />
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border border-neutral-700 bg-neutral-900 text-sm shadow-lg">
          {matches.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800"
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
