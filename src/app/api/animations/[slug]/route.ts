import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { deleteAnimationFile, writeAnimationFile } from "@/lib/github";
import { validateCss } from "@/lib/validateCss";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]">
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to edit." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: animation } = await service
    .from("animations")
    .select("id, author_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!animation) {
    return NextResponse.json({ error: "Animation not found." }, { status: 404 });
  }
  if (animation.author_id !== user.id) {
    return NextResponse.json(
      { error: "You can only edit your own animations." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, description, cssContent, category, useCase, tags } = body as {
    title?: string;
    description?: string;
    cssContent?: string;
    category?: string;
    useCase?: string;
    tags?: string[];
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

  try {
    await writeAnimationFile(slug, cssContent);
  } catch {
    return NextResponse.json(
      { error: "Failed to update the CSS file in the registry. Please try again." },
      { status: 502 }
    );
  }

  const { data: updated, error } = await service
    .from("animations")
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      css_content: cssContent,
      category: category.trim(),
      use_case: useCase?.trim() || null,
      tags: (tags ?? []).map((t) => t.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    })
    .eq("id", animation.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ animation: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]">
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to delete." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: animation } = await service
    .from("animations")
    .select("id, author_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!animation) {
    return NextResponse.json({ error: "Animation not found." }, { status: 404 });
  }
  if (animation.author_id !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own animations." },
      { status: 403 }
    );
  }

  try {
    await deleteAnimationFile(slug);
  } catch {
    return NextResponse.json(
      { error: "Failed to remove the CSS file from the registry. Please try again." },
      { status: 502 }
    );
  }

  const { error } = await service.from("animations").delete().eq("id", animation.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
