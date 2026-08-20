import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ensureDeviceId, getClientIp } from "@/lib/auth/device";

function genericError() {
  return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}${"*".repeat(Math.max(user.length - 1, 1))}@${domain}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username?.trim() || !password) {
    return NextResponse.json(
      { error: "username and password are required." },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return genericError();

  const { data: adminUser, error: adminError } = await service.auth.admin.getUserById(
    profile.id
  );
  if (adminError || !adminUser.user?.email) return genericError();
  const email = adminUser.user.email;

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return genericError();

  const okResponse = NextResponse.json({ ok: true });
  const actualDeviceId = ensureDeviceId(request, okResponse);

  const { data: trusted } = await service
    .from("trusted_devices")
    .select("id")
    .eq("user_id", profile.id)
    .eq("device_id", actualDeviceId)
    .maybeSingle();

  if (trusted) {
    service
      .from("trusted_devices")
      .update({ last_seen_at: new Date().toISOString(), last_ip: getClientIp(request) })
      .eq("id", trusted.id)
      .then(() => {});
    return okResponse;
  }

  // Local dev: skip the emailed OTP challenge so `next dev` testing doesn't
  // burn Supabase's (low, shared) email rate limit. `next build`/`next start`
  // — including Vercel's production and preview builds — set NODE_ENV to
  // "production", so this never applies to a deployed app.
  if (process.env.NODE_ENV !== "production") {
    await service.from("trusted_devices").upsert(
      { user_id: profile.id, device_id: actualDeviceId, last_ip: getClientIp(request) },
      { onConflict: "user_id,device_id" }
    );
    return okResponse;
  }

  // Unrecognized device: throw away the session we just created and require
  // an emailed code before letting this device in.
  await supabase.auth.signOut();

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) {
    if (otpError.status === 429) {
      return NextResponse.json(
        {
          error:
            "Too many confirmation emails sent recently. Please wait a few minutes and try again.",
          rateLimited: true,
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Could not send a confirmation code." }, { status: 500 });
  }

  const challengeResponse = NextResponse.json({
    ok: false,
    requiresConfirmation: true,
    emailHint: maskEmail(email),
  });
  ensureDeviceId(request, challengeResponse);
  return challengeResponse;
}
