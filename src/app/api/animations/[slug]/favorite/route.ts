import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]/favorite">
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to favorite." }, { status: 401 });
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
    .from("animation_favorites")
    .insert({ user_id: user.id, animation_id: animation.id });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/animations/[slug]/favorite">
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

  const { error } = await service
    .from("animation_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("animation_id", animation.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
