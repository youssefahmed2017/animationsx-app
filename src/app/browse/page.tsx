import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AnimationCard, { type AnimationCardData } from "@/components/AnimationCard";
import Pagination from "@/components/Pagination";
import TagFilterInput from "@/components/TagFilterInput";

type SearchParams = { q?: string; category?: string; tags?: string; sort?: string; page?: string };

const PAGE_SIZE = 24;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, category, tags, sort, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  const { data: categoryRows } = await supabase
    .from("animations")
    .select("category")
    .order("category");
  const categories = Array.from(new Set((categoryRows ?? []).map((r) => r.category)));

  const { data: tagRows } = await supabase.from("animations").select("tags");
  const allTags = Array.from(new Set((tagRows ?? []).flatMap((r) => r.tags))).sort();

  const tagList = tags
    ? tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  let query = supabase
    .from("animations")
    .select(
      "id, slug, title, description, category, tags, view_count, fork_count, like_count, created_at, author_id, profiles(username, avatar_url)",
      { count: "exact" }
    );

  if (q) {
    // .or() treats "," as a condition separator and wraps values in parens,
    // so strip characters that would break out of the filter syntax.
    const safeQ = q.replace(/[,()]/g, "").trim();
    if (safeQ) query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
  }
  if (category) query = query.eq("category", category);
  if (tagList.length > 0) query = query.contains("tags", tagList);
  query = sort === "popular" ? query.order("view_count", { ascending: false }) : query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data: animations, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  const cards: AnimationCardData[] = (animations ?? []).map((a) => ({
    ...a,
    author: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Browse animations</h1>
          <p className="text-neutral-400 text-sm mt-1">CSS-only, copy-paste ready.</p>
        </div>
      </div>

      <form className="flex flex-wrap gap-2 mb-6" action="/browse">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search title or description…"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <TagFilterInput
          name="tags"
          initialTags={tagList}
          suggestions={allTags}
          placeholder="Tags…"
        />
        <select
          name="sort"
          defaultValue={sort ?? "newest"}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-500"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
        <button className="rounded-md bg-white text-neutral-900 font-medium transition-transform active:scale-95 px-3 py-1.5 text-sm">
          Filter
        </button>
      </form>

      {error && <p className="text-sm text-red-400">Couldn&apos;t load animations: {error.message}</p>}

      {!error && cards.length === 0 && (
        <p className="text-neutral-500 text-sm">
          {q || category || tagList.length > 0 ? (
            "No animations match those filters."
          ) : (
            <>
              Nothing published yet.{" "}
              <Link href="/publish" className="underline">
                Be the first.
              </Link>
            </>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((a) => (
          <AnimationCard key={a.id} animation={a} />
        ))}
      </div>

      <Pagination
        basePath="/browse"
        params={{ q, category, tags, sort }}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
