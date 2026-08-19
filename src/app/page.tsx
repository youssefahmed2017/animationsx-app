import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = { q?: string; category?: string; sort?: string };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, category, sort } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("animations")
    .select("id, slug, title, description, category, tags, view_count, fork_count, created_at");

  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category", category);
  query = sort === "popular" ? query.order("view_count", { ascending: false }) : query.order("created_at", { ascending: false });

  const { data: animations, error } = await query.limit(60);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Browse animations</h1>
          <p className="text-neutral-400 text-sm mt-1">CSS-only, copy-paste ready.</p>
        </div>
      </div>

      <form className="flex flex-wrap gap-2 mb-6" action="/">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <input
          type="text"
          name="category"
          defaultValue={category}
          placeholder="Category…"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <select
          name="sort"
          defaultValue={sort ?? "newest"}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
        <button className="rounded-md bg-white text-neutral-900 font-medium px-3 py-1.5 text-sm">
          Filter
        </button>
      </form>

      {error && <p className="text-sm text-red-400">Couldn&apos;t load animations: {error.message}</p>}

      {!error && animations?.length === 0 && (
        <p className="text-neutral-500 text-sm">
          Nothing published yet.{" "}
          <Link href="/publish" className="underline">
            Be the first.
          </Link>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {animations?.map((a) => (
          <Link
            key={a.id}
            href={`/anim/${a.slug}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition-colors"
          >
            <h2 className="font-medium">{a.title}</h2>
            {a.description && (
              <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{a.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3 text-xs text-neutral-500">
              <span className="rounded bg-neutral-800 px-1.5 py-0.5">{a.category}</span>
              <span>{a.view_count} views</span>
              <span>{a.fork_count} forks</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
