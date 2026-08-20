import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Link prefetches (and RSC segment prefetches) fire off many parallel
  // requests for links merely visible on screen. Each one used to call
  // auth.getUser() below, and since Supabase rotates the refresh token on
  // every use, concurrent prefetches racing on the same cookie value could
  // invalidate each other ("Invalid Refresh Token: Refresh Token Not Found"),
  // corrupting the session cookie and forcing a real logout. Prefetches don't
  // need current auth state, so skip the refresh for them entirely.
  if (request.headers.get("next-router-prefetch")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session cookie if it's expired. Required for server components to read auth state.
  await supabase.auth.getUser();

  return supabaseResponse;
}
