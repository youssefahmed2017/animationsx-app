import Link from "next/link";

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, params, page - 1)}
          className="rounded-md border border-neutral-700 px-3 py-1.5 hover:border-neutral-500"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-neutral-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefFor(basePath, params, page + 1)}
          className="rounded-md border border-neutral-700 px-3 py-1.5 hover:border-neutral-500"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
