import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteAnimationFile } from "@/lib/github";
import { hasValidAdminSession, isAdminPanelEnabled } from "@/lib/adminAuth";

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/animations/[slug]">
) {
  if (!isAdminPanelEnabled() || !hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { slug } = await params;
  const service = createServiceClient();

  try {
    await deleteAnimationFile(slug);
  } catch {
    // Best-effort: still remove the DB row even if the registry file was
    // already gone/unreachable.
  }

  const { error } = await service.from("animations").delete().eq("slug", slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
