import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ALLOWED_REACTIONS, type ReactionEmoji } from "@/lib/reactions";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/comments/[id]/reactions">
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to react." }, { status: 401 });
  }

  const { emoji } = (await request.json()) as { emoji?: string };
  if (!emoji || !ALLOWED_REACTIONS.includes(emoji as ReactionEmoji)) {
    return NextResponse.json({ error: "Unsupported reaction." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: comment } = await service
    .from("comments")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const { data: existing } = await service
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await service.from("comment_reactions").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reacted: false });
  }

  const { error } = await service
    .from("comment_reactions")
    .insert({ comment_id: id, user_id: user.id, emoji });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reacted: true });
}
