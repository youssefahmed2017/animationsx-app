import Link from "next/link";
import Avatar from "@/components/Avatar";

export type AnimationCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  view_count: number;
  fork_count: number;
  like_count: number;
  author?: { username: string; avatar_url: string | null } | null;
};

export default function AnimationCard({
  animation,
  showAuthor = true,
}: {
  animation: AnimationCardData;
  showAuthor?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition-colors">
      <Link href={`/anim/${animation.slug}`}>
        <h2 className="font-medium">{animation.title}</h2>
        {animation.description && (
          <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{animation.description}</p>
        )}
      </Link>

      {showAuthor && animation.author?.username && (
        <Link
          href={`/u/${animation.author.username}`}
          className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500 hover:text-neutral-300"
        >
          <Avatar
            username={animation.author.username}
            avatarUrl={animation.author.avatar_url}
            size={16}
          />
          Created by <span className="text-neutral-400 underline">{animation.author.username}</span>
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-neutral-500">
        <Link
          href={`/browse?category=${encodeURIComponent(animation.category)}`}
          className="rounded bg-neutral-800 px-1.5 py-0.5 hover:bg-neutral-700 hover:text-neutral-200"
        >
          {animation.category}
        </Link>
        {animation.tags?.map((t) => (
          <Link
            key={t}
            href={`/browse?tags=${encodeURIComponent(t)}`}
            className="rounded bg-neutral-800 px-1.5 py-0.5 hover:bg-neutral-700 hover:text-neutral-200"
          >
            #{t}
          </Link>
        ))}
        <span>{animation.view_count} views</span>
        <span>{animation.like_count} likes</span>
        <span>{animation.fork_count} forks</span>
      </div>
    </div>
  );
}
