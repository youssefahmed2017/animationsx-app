import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import AnimationPreview from "@/components/AnimationPreview";
import CssDiff from "@/components/CssDiff";
import DeleteAnimationButton from "@/components/DeleteAnimationButton";
import CopyButton from "@/components/CopyButton";
import { HighlightedCss, HighlightedHtml } from "@/components/SyntaxHighlight";
import Avatar from "@/components/Avatar";
import LikeButton from "@/components/LikeButton";
import FavoriteButton from "@/components/FavoriteButton";
import AddCommentForm from "@/components/AddCommentForm";
import CommentThread from "@/components/CommentThread";
import { buildCommentTree } from "@/lib/commentTree";
import { ALLOWED_REACTIONS, type ReactionEmoji } from "@/lib/reactions";
import type { ReactionCounts } from "@/components/CommentReactions";

export default async function AnimationPage({ params }: PageProps<"/anim/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: animation } = await supabase
    .from("animations")
    .select(
      "id, slug, title, description, css_content, category, use_case, tags, jsdelivr_url, view_count, fork_count, like_count, forked_from_id, author_id, created_at, profiles(username, avatar_url)"
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

  const [{ data: viewerLike }, { data: viewerFavorite }, { data: comments }] = await Promise.all([
    user
      ? supabase
          .from("animation_likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("animation_id", animation.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("animation_favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("animation_id", animation.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id, body, created_at, author_id, parent_id, profiles(username, avatar_url)")
      .eq("animation_id", animation.id)
      .order("created_at", { ascending: true }),
  ]);

  const commentIds = (comments ?? []).map((c) => c.id);
  const { data: reactionRows } = commentIds.length
    ? await supabase
        .from("comment_reactions")
        .select("comment_id, emoji, user_id")
        .in("comment_id", commentIds)
    : { data: [] as { comment_id: string; emoji: string; user_id: string }[] };

  const reactionsByComment = new Map<string, ReactionCounts>();
  for (const row of reactionRows ?? []) {
    const emoji = row.emoji as ReactionEmoji;
    if (!ALLOWED_REACTIONS.includes(emoji)) continue;
    const forComment = reactionsByComment.get(row.comment_id) ?? {};
    const entry = forComment[emoji] ?? { count: 0, reactedByMe: false };
    entry.count += 1;
    if (user && row.user_id === user.id) entry.reactedByMe = true;
    forComment[emoji] = entry;
    reactionsByComment.set(row.comment_id, forComment);
  }

  const commentTree = buildCommentTree(
    (comments ?? []).map((c) => ({ ...c, reactions: reactionsByComment.get(c.id) ?? {} }))
  );

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
            <Link
              href={`/u/${author.username}`}
              className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500 hover:text-neutral-300"
            >
              <Avatar username={author.username} avatarUrl={author.avatar_url} size={20} />
              Created by <span className="underline">{author.username}</span>
            </Link>
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
          <LikeButton
            slug={animation.slug}
            initiallyLiked={!!viewerLike}
            initialCount={animation.like_count}
            signedIn={!!user}
          />
          <FavoriteButton
            slug={animation.slug}
            initiallyFavorited={!!viewerFavorite}
            signedIn={!!user}
          />
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
            className="shrink-0 rounded-md bg-white text-neutral-900 font-medium transition-transform active:scale-95 px-3 py-1.5 text-sm hover:bg-neutral-200"
          >
            Fork
          </Link>
        </div>
      </div>

      {animation.description && (
        <p className="text-neutral-400 text-sm mb-6">{animation.description}</p>
      )}

      <AnimationPreview css={animation.css_content} />

      <div className="flex flex-wrap items-center gap-1.5 mt-4 text-xs text-neutral-500">
        <Link
          href={`/browse?category=${encodeURIComponent(animation.category)}`}
          className="rounded bg-neutral-800 px-1.5 py-0.5 hover:bg-neutral-700 hover:text-neutral-200"
        >
          {animation.category}
        </Link>
        {animation.tags?.map((t: string) => (
          <Link
            key={t}
            href={`/browse?tags=${encodeURIComponent(t)}`}
            className="rounded bg-neutral-800 px-1.5 py-0.5 hover:bg-neutral-700 hover:text-neutral-200"
          >
            #{t}
          </Link>
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

      <div className="mt-10 border-t border-neutral-800 pt-6">
        <h2 className="text-sm font-medium text-neutral-300 mb-4">
          Comments {comments && comments.length > 0 ? `(${comments.length})` : ""}
        </h2>

        {user ? (
          <AddCommentForm slug={animation.slug} />
        ) : (
          <p className="text-sm text-neutral-500">
            <Link href={`/login?next=/anim/${animation.slug}`} className="underline">
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        )}

        <div className="mt-6">
          <CommentThread
            slug={animation.slug}
            comments={commentTree}
            currentUserId={user?.id}
            signedIn={!!user}
          />
          {comments && comments.length === 0 && (
            <p className="text-sm text-neutral-500">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
