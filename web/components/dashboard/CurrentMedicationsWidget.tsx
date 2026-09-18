"use client"

import Link from 'next/link'
import type { Medication } from '../../lib/types'

export default function CurrentMedicationsWidget({ medications }: { medications: Medication[] }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const activeMeds = medications.filter((m) => {
    if (m.is_active === false) return false
    const started = !m.start_date || m.start_date.slice(0, 10) <= todayStr
    const notEnded = !m.end_date || m.end_date.slice(0, 10) >= todayStr
    return started && notEnded
  })

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            Current Medications
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/medicines"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Schedule →
          </Link>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {activeMeds.length} active
          </span>
        </div>
      </div>

      {/* Content */}
      {activeMeds.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No active prescriptions
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed mb-4">
            Upload prescription slips or clinical notes to extract medication schedules automatically.
          </p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition"
          >
            Upload Prescription
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activeMeds.map((med) => (
            <div
              key={med.id}
              className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {med.medicine_name}
                </h4>
                {med.dosage && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                    {med.dosage}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="truncate">{med.frequency || 'Daily regimen'}</span>
                {med.document_id && (
                  <Link
                    href={`/api/documents/${med.document_id}/view`}
                    target="_blank"
                    className="font-medium text-blue-600 hover:underline shrink-0"
                  >
                    Source Rx →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
