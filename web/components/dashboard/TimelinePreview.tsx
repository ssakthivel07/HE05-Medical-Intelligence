"use client"

import Link from 'next/link'
import type { MedicalEvent } from '../../lib/types'

export default function TimelinePreview({ events }: { events: MedicalEvent[] }) {
  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('lab') || t.includes('test') || t.includes('scan')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900'
    }
    if (t.includes('prescription')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
    }
    if (t.includes('admission') || t.includes('surgery') || t.includes('hospital')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
    }
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900'
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
            Timeline Preview
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/timeline"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
          >
            Full Timeline →
          </Link>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Content */}
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Timeline not yet populated
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed mb-4">
            Clinical visits, lab tests, and prescriptions will appear chronologically once documents are uploaded.
          </p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 transition"
          >
            Upload to Populate
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 4).map((event) => {
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
                className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 transition space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getBadgeColor(
                          event.event_type
                        )}`}
                      >
                        {event.event_type.replace('_', ' ')}
                      </span>
                      {event.is_verified && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate pt-0.5">
                      {event.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500 whitespace-nowrap">{dateStr}</span>
                </div>

                {event.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                {event.document_id && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <Link
                      href={`/api/documents/${event.document_id}/view`}
                      target="_blank"
                      className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      Source doc →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
