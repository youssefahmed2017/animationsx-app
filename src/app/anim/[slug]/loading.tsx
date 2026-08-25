export default function AnimationLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 skeleton-fade-in">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="h-7 w-64 rounded bg-neutral-800 animate-pulse" />
          <div className="flex items-center gap-1.5 mt-2">
            <div className="h-5 w-5 rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-3 w-32 rounded bg-neutral-800 animate-pulse" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-8 w-16 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
          <div className="h-8 w-10 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
          <div className="h-8 w-14 rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
        </div>
      </div>

      <div className="h-4 w-3/4 rounded bg-neutral-800 animate-pulse mt-3 mb-6" />

      <div className="h-72 w-full rounded-lg bg-neutral-900 border border-neutral-800 animate-pulse" />

      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        <div className="h-5 w-16 rounded bg-neutral-800 animate-pulse" />
        <div className="h-5 w-12 rounded bg-neutral-800 animate-pulse" />
        <div className="h-3 w-14 rounded bg-neutral-800 animate-pulse" />
      </div>

      <div className="mt-8">
        <div className="h-4 w-16 rounded bg-neutral-800 animate-pulse mb-2" />
        <div className="h-10 w-full rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
      </div>

      <div className="mt-6">
        <div className="h-4 w-10 rounded bg-neutral-800 animate-pulse mb-2" />
        <div className="h-24 w-full rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
      </div>

      <div className="mt-10 border-t border-neutral-800 pt-6">
        <div className="h-4 w-24 rounded bg-neutral-800 animate-pulse mb-4" />
        <div className="h-20 w-full rounded-md bg-neutral-900 border border-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}
