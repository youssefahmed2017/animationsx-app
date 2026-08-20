import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/comments/[id]">
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: comment } = await service
    .from("comments")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }
  if (comment.author_id !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own comments." },
      { status: 403 }
    );
  }

  const { error } = await service.from("comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
