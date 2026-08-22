import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasValidAdminSession, isAdminPanelEnabled } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!isAdminPanelEnabled() || !hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const service = createServiceClient();

  const { data: animations, error } = await service
    .from("animations")
    .select(
      "id, slug, title, category, author_id, view_count, fork_count, like_count, created_at, profiles(username)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ animations });
}
