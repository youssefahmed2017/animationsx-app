import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { writeAnimationFile } from "@/lib/github";
import { validateCss, slugify } from "@/lib/validateCss";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to publish." }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, cssContent, category, useCase, tags, forkedFromSlug } = body as {
    title?: string;
    description?: string;
    cssContent?: string;
    category?: string;
    useCase?: string;
    tags?: string[];
    forkedFromSlug?: string;
  };

  if (!title?.trim() || !cssContent?.trim() || !category?.trim()) {
    return NextResponse.json(
      { error: "title, cssContent, and category are required." },
      { status: 400 }
    );
  }

  const check = validateCss(cssContent);
  if (!check.valid) {
    return NextResponse.json({ error: check.reason }, { status: 422 });
  }

  const service = createServiceClient();

  let forkedFromId: string | null = null;
  if (forkedFromSlug) {
    const { data: original } = await service
      .from("animations")
      .select("id")
      .eq("slug", forkedFromSlug)
      .maybeSingle();
    forkedFromId = original?.id ?? null;
  }

  const baseSlug = slugify(title);
  let slug = baseSlug;
  for (let i = 1; i <= 20; i++) {
    const { data: existing } = await service
      .from("animations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  let jsdelivrUrl: string;
  try {
    jsdelivrUrl = await writeAnimationFile(slug, cssContent);
  } catch {
    return NextResponse.json(
      { error: "Failed to publish CSS file to the registry. Please try again." },
      { status: 502 }
    );
  }

  const { data: animation, error } = await service
    .from("animations")
    .insert({
      slug,
      title: title.trim(),
      description: description?.trim() || null,
      css_content: cssContent,
      category: category.trim(),
      use_case: useCase?.trim() || null,
      tags: (tags ?? []).map((t) => t.trim()).filter(Boolean),
      author_id: user.id,
      jsdelivr_url: jsdelivrUrl,
      forked_from_id: forkedFromId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (forkedFromId) {
    await service.rpc("increment_fork_count", { animation_id: forkedFromId });
  }

  return NextResponse.json({ animation }, { status: 201 });
}
