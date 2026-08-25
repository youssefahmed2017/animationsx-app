function CardSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="h-4 w-2/3 rounded bg-neutral-800 animate-pulse" />
      <div className="h-3 w-full rounded bg-neutral-800 animate-pulse mt-2" />
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <div className="h-5 w-16 rounded bg-neutral-800 animate-pulse" />
        <div className="h-3 w-14 rounded bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 skeleton-fade-in">
      <aside className="space-y-6">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-neutral-800 animate-pulse" />
          </div>
          <div className="h-3 w-40 rounded bg-neutral-800 animate-pulse mt-4" />
          <div className="h-3 w-32 rounded bg-neutral-800 animate-pulse mt-2" />
        </div>

        <div className="h-9 w-full rounded-md bg-neutral-800 animate-pulse" />

        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-neutral-800 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
        </div>
      </aside>

      <div>
        <div className="h-5 w-40 rounded bg-neutral-800 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
