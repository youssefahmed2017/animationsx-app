import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import AnimationPreview from "@/components/AnimationPreview";
import CssDiff from "@/components/CssDiff";
import DeleteAnimationButton from "@/components/DeleteAnimationButton";
import CopyButton from "@/components/CopyButton";
import { HighlightedCss, HighlightedHtml } from "@/components/SyntaxHighlight";

export default async function AnimationPage({ params }: PageProps<"/anim/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: animation } = await supabase
    .from("animations")
    .select(
      "id, slug, title, description, css_content, category, use_case, tags, jsdelivr_url, view_count, fork_count, forked_from_id, author_id, created_at, profiles(username)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!animation) notFound();

  const forkedFrom = animation.forked_from_id
    ? (
        await supabase
          .from("animations")
          .select("slug, title, css_content")
          .eq("id", animation.forked_from_id)
          .maybeSingle()
      ).data
    : null;

  // Fire-and-forget view count increment via the service client (bypasses RLS; no client-facing write policy exists).
  createServiceClient()
    .rpc("increment_view_count", { animation_slug: slug })
    .then(() => {});

  const author = Array.isArray(animation.profiles)
    ? animation.profiles[0]
    : animation.profiles;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold">{animation.title}</h1>
          {author?.username && (
            <p className="text-neutral-500 text-sm mt-1">by {author.username}</p>
          )}
          {forkedFrom && (
            <p className="text-neutral-500 text-sm mt-1">
              remixed from{" "}
              <Link href={`/anim/${forkedFrom.slug}`} className="underline">
                {forkedFrom.title}
              </Link>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user?.id === animation.author_id && (
            <>
              <Link
                href={`/anim/${animation.slug}/edit`}
                className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500"
              >
                Edit
              </Link>
              <DeleteAnimationButton slug={animation.slug} />
            </>
          )}
          <Link
            href={`/publish?fork=${animation.slug}`}
            className="shrink-0 rounded-md bg-white text-neutral-900 font-medium px-3 py-1.5 text-sm hover:bg-neutral-200"
          >
            Fork
          </Link>
        </div>
      </div>

      {animation.description && (
        <p className="text-neutral-400 text-sm mb-6">{animation.description}</p>
      )}

      <AnimationPreview css={animation.css_content} />

      <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-neutral-500">
        <span className="rounded bg-neutral-800 px-1.5 py-0.5">{animation.category}</span>
        {animation.tags?.map((t: string) => (
          <span key={t} className="rounded bg-neutral-800 px-1.5 py-0.5">
            #{t}
          </span>
        ))}
        <span>{animation.view_count} views</span>
        <span>{animation.fork_count} forks</span>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-300">Embed</h2>
          <CopyButton text={`<link rel="stylesheet" href="${animation.jsdelivr_url}">`} />
        </div>
        <pre className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-xs overflow-x-auto">
          <HighlightedHtml html={`<link rel="stylesheet" href="${animation.jsdelivr_url}">`} />
        </pre>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-neutral-300">CSS</h2>
          <CopyButton text={animation.css_content} />
        </div>
        <pre className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-xs overflow-x-auto whitespace-pre-wrap">
          <HighlightedCss css={animation.css_content} />
        </pre>
      </div>

      {forkedFrom && (
        <CssDiff
          originalCss={forkedFrom.css_content}
          forkedCss={animation.css_content}
          originalTitle={forkedFrom.title}
        />
      )}
    </div>
  );
}
