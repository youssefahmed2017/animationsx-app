import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ensureDeviceId, getClientIp } from "@/lib/auth/device";

/**
 * Marks the calling device as trusted for the currently-authenticated user.
 * Used after flows that already proved email ownership out-of-band
 * (signup confirmation link, password reset), so those devices don't get
 * hit with a redundant OTP challenge on their next password login.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const deviceId = ensureDeviceId(request, response);

  const service = createServiceClient();
  await service.from("trusted_devices").upsert(
    {
      user_id: user.id,
      device_id: deviceId,
      last_ip: getClientIp(request),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  );

  return response;
}
