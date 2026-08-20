import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimationCard, { type AnimationCardData } from "@/components/AnimationCard";
import SidebarAnimationList from "@/components/SidebarAnimationList";
import Avatar from "@/components/Avatar";

const RECENT_LIMIT = 6;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/home");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();
  const username = profile?.username ?? "";

  const { data: yourAnimations } = await supabase
    .from("animations")
    .select("slug, title, category")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const { data: statsRows } = await supabase
    .from("animations")
    .select("view_count, fork_count")
    .eq("author_id", user.id);
  const totalPublished = statsRows?.length ?? 0;
  const totalViews = (statsRows ?? []).reduce((sum, a) => sum + a.view_count, 0);
  const totalForks = (statsRows ?? []).reduce((sum, a) => sum + a.fork_count, 0);

  const [{ count: followerCount }, { count: followingCount }, { data: followingRows }] =
    await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
    ]);
  const followingIds = (followingRows ?? []).map((f) => f.following_id);

  const CARD_FIELDS =
    "id, slug, title, description, category, tags, view_count, fork_count, like_count, author_id, profiles(username, avatar_url)";

  const [{ data: recent }, { data: followingAnimations }] = await Promise.all([
    supabase
      .from("animations")
      .select(CARD_FIELDS)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    followingIds.length > 0
      ? supabase
          .from("animations")
          .select(CARD_FIELDS)
          .in("author_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(RECENT_LIMIT)
      : Promise.resolve({ data: [] }),
  ]);

  const toCards = (rows: typeof recent): AnimationCardData[] =>
    (rows ?? []).map((a) => ({
      ...a,
      author: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
    }));

  const recentCards = toCards(recent);
  const followingCards = toCards(followingAnimations);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
      <aside className="space-y-6">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-3">
            <Avatar username={username} avatarUrl={profile?.avatar_url} size={40} />
            <Link href={`/u/${username}`} className="font-medium hover:underline">
              {username}
            </Link>
          </div>
          {profile?.bio && <p className="text-neutral-400 text-sm mt-3">{profile.bio}</p>}
          <p className="text-neutral-500 text-xs mt-3">
            {totalPublished} published · {totalViews} views · {totalForks} forks
          </p>
          <p className="text-neutral-500 text-xs mt-1">
            {followerCount ?? 0} followers · {followingCount ?? 0} following
          </p>
          <Link
            href="/account"
            className="inline-block mt-3 text-xs text-neutral-400 hover:text-neutral-200 underline"
          >
            Account settings
          </Link>
        </div>

        <Link
          href="/publish"
          className="block text-center rounded-md bg-white text-neutral-900 font-medium py-2 text-sm hover:bg-neutral-200"
        >
          New Animation
        </Link>

        <SidebarAnimationList animations={yourAnimations ?? []} username={username} />
      </aside>

      <div>
        {followingCards.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">From people you follow</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {followingCards.map((a) => (
                <AnimationCard key={a.id} animation={a} />
              ))}
            </div>
          </>
        )}

        <h2 className="text-lg font-semibold mb-4">Recently published</h2>
        {recentCards.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nothing published yet across AnimationsX.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentCards.map((a) => (
              <AnimationCard key={a.id} animation={a} />
            ))}
          </div>
        )}
        <Link
          href="/"
          className="inline-block mt-4 text-sm underline text-neutral-400 hover:text-neutral-200"
        >
          Browse all →
        </Link>
      </div>
    </div>
  );
}
