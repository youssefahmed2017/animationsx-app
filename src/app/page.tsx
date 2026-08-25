import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimationPreview from "@/components/AnimationPreview";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  const { data: featured } = await supabase
    .from("animations")
    .select("slug, title, css_content")
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          CSS animations, ready to paste.
        </h1>
        <p className="mt-4 text-lg text-neutral-400 max-w-xl mx-auto">
          A community registry of copy-paste-ready CSS animations. Publish your own, browse what
          others made, fork and remix anything — no JavaScript, no build step.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-white text-neutral-900 font-medium transition-transform active:scale-95 px-5 py-2.5 text-sm hover:bg-neutral-200"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/browse"
            className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm hover:border-neutral-500"
          >
            Browse animations
          </Link>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </section>

      {featured && (
        <section className="mx-auto max-w-2xl px-4 pb-16">
          <p className="text-center text-xs uppercase tracking-wide text-neutral-500 mb-3">
            Live on AnimationsX right now
          </p>
          <AnimationPreview css={featured.css_content} />
          <p className="text-center text-sm text-neutral-500 mt-3">
            <Link href={`/anim/${featured.slug}`} className="underline">
              {featured.title} →
            </Link>
          </p>
        </section>
      )}

      <section className="border-t border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <h2 className="font-medium mb-1.5">Publish</h2>
            <p className="text-sm text-neutral-400">
              Share pure-CSS animations with the world. Every publish gets a CDN-hosted
              stylesheet you can drop straight into a{" "}
              <code className="text-neutral-300">&lt;link&gt;</code> tag.
            </p>
          </div>
          <div>
            <h2 className="font-medium mb-1.5">Fork &amp; remix</h2>
            <p className="text-sm text-neutral-400">
              Found something close but not quite right? Fork it, tweak the CSS, and publish your
              own version — with a diff against the original built in.
            </p>
          </div>
          <div>
            <h2 className="font-medium mb-1.5">Like, comment, follow</h2>
            <p className="text-sm text-neutral-400">
              Favorite the ones you&apos;ll reuse later, comment on what you love, and follow
              creators whose work you want to see more of.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
