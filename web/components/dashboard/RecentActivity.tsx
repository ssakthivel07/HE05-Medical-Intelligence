import type { MedicalEvent } from '../../lib/types'

export default function RecentActivity({ events }: { events: MedicalEvent[] }) {
  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('diagnosis') || t.includes('condition')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900'
    }
    if (t.includes('surgery') || t.includes('procedure')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
    }
    if (t.includes('lab') || t.includes('test') || t.includes('scan')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900'
    }
    return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            Recent Medical Activity
          </h3>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Content */}
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No medical events recorded yet
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Past diagnoses, surgeries, clinical consultations, and treatments will appear here in chronological order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const dateStr = event.event_date
              ? new Date(event.event_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown date'

            return (
              <div
                key={event.id}
                className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border ${getBadgeColor(
                          event.event_type
                        )}`}
                      >
                        {event.event_type}
                      </span>
                      {event.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {event.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap pt-0.5">
                    {dateStr}
                  </span>
                </div>

                {event.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
