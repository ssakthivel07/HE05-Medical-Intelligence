export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-800/60 rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-14 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />

      {/* Document item skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="h-7 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
