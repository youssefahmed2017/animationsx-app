import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { deleteAnimationFile } from "@/lib/github";
import { isValidUsername } from "@/lib/validateUsername";
import { MAX_BIO_LENGTH } from "@/lib/profileLimits";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const { username, email, avatarUrl, bio } = body as {
    username?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
  };

  if (username !== undefined) {
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3-24 characters: letters, numbers, _ or -." },
        { status: 400 }
      );
    }

    const service = createServiceClient();
    const { data: existing } = await service
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (error) {
      const message = error.code === "23505" ? "That username is already taken." : error.message;
      return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
    }
  }

  if (email !== undefined) {
    if (!email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (avatarUrl !== undefined) {
    const trimmed = avatarUrl.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      return NextResponse.json(
        { error: "Avatar URL must start with http:// or https://" },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: trimmed || null })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (bio !== undefined) {
    if (bio.length > MAX_BIO_LENGTH) {
      return NextResponse.json(
        { error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("profiles")
      .update({ bio: bio.trim() || null })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * Deletes the signed-in user's account. DB cleanup (profile + animations
 * rows) cascades automatically via the FKs in supabase/schema.sql; this
 * additionally best-effort removes their published CSS files from the
 * GitHub-hosted registry so jsDelivr doesn't keep serving orphaned files.
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: ownedAnimations } = await service
    .from("animations")
    .select("slug")
    .eq("author_id", user.id);

  for (const animation of ownedAnimations ?? []) {
    try {
      await deleteAnimationFile(animation.slug);
    } catch {
      // Best-effort: an orphaned registry file isn't worth blocking account deletion over.
    }
  }

  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
