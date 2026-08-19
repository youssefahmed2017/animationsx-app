"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function NavAuth() {
  // undefined = auth state not checked yet, null = confirmed signed out.
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (user === undefined) {
    return (
      <span className="flex items-center gap-4">
        <span className="h-4 w-14 rounded bg-neutral-800 animate-pulse" />
        <span className="h-8 w-16 rounded-md bg-neutral-800 animate-pulse" />
      </span>
    );
  }

  if (user === null) {
    return (
      <>
        <Link href="/login" className="hover:text-white text-neutral-300">
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-white px-3 py-1.5 text-neutral-900 font-medium hover:bg-neutral-200"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className="hover:text-white text-neutral-300"
    >
      Sign out
    </button>
  );
}
