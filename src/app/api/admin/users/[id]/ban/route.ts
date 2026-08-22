import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasValidAdminSession, isAdminPanelEnabled } from "@/lib/adminAuth";

// Effectively permanent (Supabase's admin API takes a duration, not a
// boolean); enforced by Supabase Auth itself on every sign-in attempt, not
// just this app's own login route.
const PERMANENT_BAN_DURATION = "876000h";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/users/[id]/ban">
) {
  if (!isAdminPanelEnabled() || !hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { error } = await service.auth.admin.updateUserById(id, {
    ban_duration: PERMANENT_BAN_DURATION,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/users/[id]/ban">
) {
  if (!isAdminPanelEnabled() || !hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { error } = await service.auth.admin.updateUserById(id, {
    ban_duration: "none",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
