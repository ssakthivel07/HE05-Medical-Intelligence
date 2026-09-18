export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-4 space-y-6 shrink-0">
        <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-7 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
        </header>

        {/* Dashboard content skeleton */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-800/80 rounded animate-pulse" />
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 animate-pulse">
                <div className="h-9 w-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                <div className="h-7 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>

          {/* Columns skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 animate-pulse">
                <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
                <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
