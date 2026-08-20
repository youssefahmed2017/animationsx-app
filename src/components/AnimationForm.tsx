"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimationPreview from "@/components/AnimationPreview";
import TagInput from "@/components/TagInput";
import { MAX_CSS_LENGTH } from "@/lib/validateCss";
import { MAX_JS_LENGTH } from "@/lib/jsGeneratorLimits";
import { useDebounced } from "@/lib/useDebounced";
import { useToast } from "@/components/Toast";

export type AnimationFormInitialData = {
  title: string;
  description: string;
  category: string;
  useCase: string;
  tags: string[];
  cssContent: string;
  jsSource: string;
};

type Props =
  | {
      mode: "create";
      forkedFromSlug?: string;
      initialData: AnimationFormInitialData;
    }
  | {
      mode: "edit";
      slug: string;
      initialData: AnimationFormInitialData;
    };

export default function AnimationForm(props: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { initialData } = props;

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [category, setCategory] = useState(initialData.category);
  const [useCase, setUseCase] = useState(initialData.useCase);
  const [tags, setTags] = useState(initialData.tags);
  const [cssContent, setCssContent] = useState(initialData.cssContent);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showGenerator, setShowGenerator] = useState(!!initialData.jsSource);
  const [jsSource, setJsSource] = useState(initialData.jsSource);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Debounced so the sandboxed preview iframe isn't torn down/rebuilt on every keystroke.
  const previewCss = useDebounced(cssContent, 250);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError("");

    const res = await fetch("/api/generate-css", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ js: jsSource }),
    });
    const json = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setGenerateError(json.error ?? "Something went wrong.");
      return;
    }
    setCssContent(json.css);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const payload = {
      title,
      description,
      category,
      useCase,
      cssContent,
      jsSource: showGenerator ? jsSource : "",
      tags,
      ...(props.mode === "create" && props.forkedFromSlug
        ? { forkedFromSlug: props.forkedFromSlug }
        : {}),
    };

    const url = props.mode === "create" ? "/api/publish" : `/api/animations/${props.slug}`;
    const res = await fetch(url, {
      method: props.mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(json.error ?? "Something went wrong.");
      return;
    }

    const targetSlug = props.mode === "create" ? json.animation.slug : props.slug;
    showToast(props.mode === "create" ? "Published." : "Changes saved.");
    router.push(`/anim/${targetSlug}`);
  }

  const heading =
    props.mode === "edit"
      ? "Edit animation"
      : props.forkedFromSlug
      ? "Fork animation"
      : "Publish an animation";
  const submitLabel = props.mode === "edit" ? "Save changes" : "Publish";
  const submittingLabel = props.mode === "edit" ? "Saving…" : "Publishing…";

  const cssOverLimit = cssContent.length > MAX_CSS_LENGTH;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">{heading}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Description <span className="text-neutral-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Category *</label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. loaders"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Use case <span className="text-neutral-600">(optional)</span>
              </label>
              <input
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                placeholder="e.g. button hover"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Tags <span className="text-neutral-600">(optional)</span>
            </label>
            <TagInput tags={tags} onChange={setTags} placeholder="fade, hover, subtle…" />
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowGenerator((v) => !v)}
              className="text-xs text-neutral-400 hover:text-neutral-200 underline"
            >
              {showGenerator ? "Hide JS generator" : "Generate CSS from JS instead…"}
            </button>
          </div>

          {showGenerator && (
            <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="block text-sm text-neutral-400">
                  JS generator{" "}
                  <span className="text-neutral-600">
                    (last expression must be the CSS string)
                  </span>
                </label>
                <span
                  className={`text-xs ${
                    jsSource.length > MAX_JS_LENGTH ? "text-red-400" : "text-neutral-500"
                  }`}
                >
                  {jsSource.length.toLocaleString()} / {MAX_JS_LENGTH.toLocaleString()}
                </span>
              </div>
              <textarea
                value={jsSource}
                onChange={(e) => setJsSource(e.target.value)}
                rows={8}
                spellCheck={false}
                placeholder={
                  'let css = "";\nfor (let i = 0; i <= 10; i++) {\n  css += `${i * 10}% { opacity: ${i / 10}; }\\n`;\n}\n`@keyframes fade { ${css} }`'
                }
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-mono outline-none focus:border-neutral-500"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !jsSource.trim() || jsSource.length > MAX_JS_LENGTH}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500 disabled:opacity-50"
                >
                  {generating ? "Generating…" : "Generate CSS"}
                </button>
                {generateError && <p className="text-sm text-red-400">{generateError}</p>}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block text-sm text-neutral-400">CSS *</label>
              <span
                className={`text-xs ${cssOverLimit ? "text-red-400" : "text-neutral-500"}`}
              >
                {cssContent.length.toLocaleString()} / {MAX_CSS_LENGTH.toLocaleString()}
              </span>
            </div>
            <textarea
              required
              value={cssContent}
              onChange={(e) => setCssContent(e.target.value)}
              rows={14}
              spellCheck={false}
              className={`w-full rounded-md border bg-neutral-900 px-3 py-2 text-sm font-mono outline-none ${
                cssOverLimit
                  ? "border-red-800 focus:border-red-600"
                  : "border-neutral-700 focus:border-neutral-500"
              }`}
            />
          </div>

          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || cssOverLimit}
              className="flex-1 rounded-md bg-white text-neutral-900 font-medium py-2 text-sm disabled:opacity-50"
            >
              {submitting ? submittingLabel : submitLabel}
            </button>
            {props.mode === "edit" && (
              <Link
                href={`/anim/${props.slug}`}
                className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
              >
                Cancel
              </Link>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Live preview</label>
          <AnimationPreview css={previewCss} />
        </div>
      </form>
    </div>
  );
}
