"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AnimationForm, { type AnimationFormInitialData } from "@/components/AnimationForm";

const DEFAULT_CSS = `.animate-target {
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.7; }
}`;

const EMPTY_DATA: AnimationFormInitialData = {
  title: "",
  description: "",
  category: "",
  useCase: "",
  tags: [],
  cssContent: DEFAULT_CSS,
  jsSource: "",
};

export default function PublishPage() {
  return (
    <Suspense fallback={null}>
      <PublishGate />
    </Suspense>
  );
}

function PublishGate() {
  const searchParams = useSearchParams();
  const forkSlug = searchParams.get("fork") ?? undefined;
  const supabase = createClient();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [initialData, setInitialData] = useState<AnimationFormInitialData>(EMPTY_DATA);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setCheckingAuth(false);
    });
  }, [supabase]);

  useEffect(() => {
    if (!forkSlug) return;
    supabase
      .from("animations")
      .select("title, description, category, use_case, tags, css_content, js_source")
      .eq("slug", forkSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setInitialData({
          title: `${data.title} (fork)`,
          description: data.description ?? "",
          category: data.category ?? "",
          useCase: data.use_case ?? "",
          tags: data.tags ?? [],
          cssContent: data.css_content,
          jsSource: data.js_source ?? "",
        });
      });
  }, [forkSlug, supabase]);

  if (checkingAuth) return null;

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-neutral-300">You need to sign in to publish an animation.</p>
        <a href="/login" className="inline-block mt-4 underline text-sm">
          Go to sign in
        </a>
      </div>
    );
  }

  return <AnimationForm mode="create" forkedFromSlug={forkSlug} initialData={initialData} />;
}
