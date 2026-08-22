import { NextRequest, NextResponse } from "next/server";
import { hasValidAdminSession, isAdminPanelEnabled } from "@/lib/adminAuth";
import { deleteUserAccount } from "@/lib/userDeletion";

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/users/[id]">
) {
  if (!isAdminPanelEnabled() || !hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { id } = await params;
  const { error } = await deleteUserAccount(id);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
