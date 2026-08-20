import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/users/[username]/follow">
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to follow." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: target } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });
  }

  const { error } = await service
    .from("follows")
    .insert({ follower_id: user.id, following_id: target.id });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/users/[username]/follow">
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: target } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { error } = await service
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", target.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
