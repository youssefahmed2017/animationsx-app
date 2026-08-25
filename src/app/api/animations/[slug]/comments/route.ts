import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const MAX_COMMENT_LENGTH = 1000;

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]/comments">
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to comment." }, { status: 401 });
  }

  const payload = await request.json();
  const { body, parentId } = payload as { body?: string; parentId?: string };
  const trimmed = body?.trim();

  if (!trimmed) {
    return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  const { data: animation } = await service
    .from("animations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!animation) {
    return NextResponse.json({ error: "Animation not found." }, { status: 404 });
  }

  if (parentId) {
    const { data: parent } = await service
      .from("comments")
      .select("id")
      .eq("id", parentId)
      .eq("animation_id", animation.id)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
    }
  }

  const { data: comment, error } = await service
    .from("comments")
    .insert({
      animation_id: animation.id,
      author_id: user.id,
      parent_id: parentId ?? null,
      body: trimmed,
    })
    .select("id, body, parent_id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
