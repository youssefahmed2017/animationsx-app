import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimationCard, { type AnimationCardData } from "@/components/AnimationCard";
import Pagination from "@/components/Pagination";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";

const PAGE_SIZE = 24;

export default async function ProfilePage({
  params,
  searchParams,
}: PageProps<"/u/[username]">) {
  const { username } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const [{ count: followerCount }, { count: followingCount }, { data: viewerFollow }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
      viewer && viewer.id !== profile.id
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewer.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const from = (page - 1) * PAGE_SIZE;
  const {
    data: animations,
    error,
    count,
  } = await supabase
    .from("animations")
    .select(
      "id, slug, title, description, category, tags, view_count, fork_count, like_count, created_at",
      { count: "exact" }
    )
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  // Aggregated across *all* of this author's animations, not just this page.
  const { data: statsRows } = await supabase
    .from("animations")
    .select("view_count, fork_count")
    .eq("author_id", profile.id);
  const totalViews = (statsRows ?? []).reduce((sum, a) => sum + a.view_count, 0);
  const totalForks = (statsRows ?? []).reduce((sum, a) => sum + a.fork_count, 0);

  const cards: AnimationCardData[] = animations ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={64} />
          <div>
            <h1 className="text-2xl font-semibold">{profile.username}</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {count ?? 0} published · {totalViews} views · {totalForks} forks
            </p>
            <p className="text-neutral-500 text-xs mt-1">
              {followerCount ?? 0} followers · {followingCount ?? 0} following
            </p>
          </div>
        </div>
        {(!viewer || viewer.id !== profile.id) && (
          <FollowButton
            username={profile.username}
            initiallyFollowing={!!viewerFollow}
            signedIn={!!viewer}
          />
        )}
      </div>
      {profile.bio && <p className="text-neutral-400 text-sm mt-4 max-w-2xl">{profile.bio}</p>}

      {error && <p className="text-sm text-red-400 mt-6">Couldn&apos;t load animations: {error.message}</p>}

      {!error && cards.length === 0 && (
        <p className="text-neutral-500 text-sm mt-6">Nothing published yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {cards.map((a) => (
          <AnimationCard key={a.id} animation={a} showAuthor={false} />
        ))}
      </div>

      <Pagination basePath={`/u/${username}`} params={{}} page={page} totalPages={totalPages} />
    </div>
  );
}
