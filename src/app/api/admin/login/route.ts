import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, isAdminPanelEnabled, setAdminSessionCookie } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (!isAdminPanelEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response);
  return response;
}
