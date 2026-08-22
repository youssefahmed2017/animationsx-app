import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasValidAdminSession, isAdminPanelEnabled } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (!isAdminPanelEnabled() || !hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const service = createServiceClient();

  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email + ban status live on auth.users, not profiles; page through the
  // admin API to build an id -> auth-user map (capped — this panel isn't
  // built for huge user counts).
  const authById = new Map<string, { email: string | null; bannedUntil: string | null }>();
  for (let page = 1; page <= 20; page++) {
    const { data, error: listError } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (listError || !data?.users?.length) break;
    for (const u of data.users) {
      authById.set(u.id, {
        email: u.email ?? null,
        bannedUntil: u.banned_until ?? null,
      });
    }
    if (data.users.length < 200) break;
  }

  const now = Date.now();
  const users = (profiles ?? []).map((p) => {
    const auth = authById.get(p.id);
    const bannedUntil = auth?.bannedUntil ?? null;
    const banned = !!bannedUntil && new Date(bannedUntil).getTime() > now;
    return {
      ...p,
      email: auth?.email ?? null,
      banned,
    };
  });

  return NextResponse.json({ users });
}
