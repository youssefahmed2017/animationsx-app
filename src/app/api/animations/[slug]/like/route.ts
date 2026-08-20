import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]/like">
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to like." }, { status: 401 });
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

  const { error } = await service
    .from("animation_likes")
    .insert({ user_id: user.id, animation_id: animation.id });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // already liked
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await service.rpc("increment_like_count", { animation_id: animation.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]/like">
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
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

  const { data: existingLike } = await service
    .from("animation_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("animation_id", animation.id)
    .maybeSingle();

  if (existingLike) {
    await service.from("animation_likes").delete().eq("id", existingLike.id);
    await service.rpc("decrement_like_count", { animation_id: animation.id });
  }

  return NextResponse.json({ ok: true });
}
