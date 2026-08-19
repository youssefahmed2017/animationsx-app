import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, email, password } = body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "username, email, and password are required." },
      { status: 400 }
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-24 characters: letters, numbers, _ or -." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  const { data: existing } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const supabase = await createClient();
  const origin = request.nextUrl.origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${origin}/auth/confirmed`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Supabase intentionally returns a "successful" response with no error
  // when the email is already registered and confirmed (anti-enumeration:
  // it won't say "that email exists"), but also sends no email. The only
  // client-visible signal is an empty identities array on the returned user.
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try signing in instead." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
