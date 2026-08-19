import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ensureDeviceId, getClientIp } from "@/lib/auth/device";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, code } = body as { username?: string; code?: string };

  if (!username?.trim() || !code?.trim()) {
    return NextResponse.json(
      { error: "username and code are required." },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  const { data: adminUser, error: adminError } = await service.auth.admin.getUserById(
    profile.id
  );
  if (adminError || !adminUser.user?.email) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }
  const email = adminUser.user.email;

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (verifyError) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const deviceId = ensureDeviceId(request, response);

  await service.from("trusted_devices").upsert(
    {
      user_id: profile.id,
      device_id: deviceId,
      last_ip: getClientIp(request),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  );

  return response;
}
