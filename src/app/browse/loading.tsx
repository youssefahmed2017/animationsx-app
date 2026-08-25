function CardSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="h-4 w-2/3 rounded bg-neutral-800 animate-pulse" />
      <div className="h-3 w-full rounded bg-neutral-800 animate-pulse mt-2" />
      <div className="h-3 w-4/5 rounded bg-neutral-800 animate-pulse mt-1.5" />
      <div className="flex items-center gap-1.5 mt-3">
        <div className="h-4 w-4 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-3 w-20 rounded bg-neutral-800 animate-pulse" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <div className="h-5 w-16 rounded bg-neutral-800 animate-pulse" />
        <div className="h-5 w-12 rounded bg-neutral-800 animate-pulse" />
        <div className="h-3 w-14 rounded bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <div className="h-7 w-56 rounded bg-neutral-800 animate-pulse" />
        <div className="h-4 w-40 rounded bg-neutral-800 animate-pulse mt-2" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-9 w-48 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
        <div className="h-9 w-36 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
        <div className="h-9 w-32 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
        <div className="h-9 w-24 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
