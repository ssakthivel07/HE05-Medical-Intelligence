import Link from 'next/link'
import type { MedicalDocument } from '../../lib/types'

export default function RecentDocuments({ docs }: { docs: MedicalDocument[] }) {
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'processed' || s === 'completed' || s === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Processed
        </span>
      )
    }
    if (s === 'processing' || s === 'analyzing') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          Processing
        </span>
      )
    }
    if (s === 'failed' || s === 'error') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Failed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        {status || 'Uploaded'}
      </span>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            Recent Documents
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/documents"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            Manage Docs →
          </Link>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {docs.length} {docs.length === 1 ? 'doc' : 'docs'}
          </span>
        </div>
      </div>

      {/* Content */}
      {docs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No medical documents yet
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed mb-4">
            Upload diagnostic reports, blood test results, and imaging summaries to centralize your records.
          </p>

          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload your first medical document
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const dateStr = doc.document_date
              ? new Date(doc.document_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown date'

            return (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {doc.file_name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span className="capitalize">{doc.document_type || 'Document'}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>
                    {(doc.hospital_name || doc.doctor_name) && (
                      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                        {[doc.doctor_name, doc.hospital_name].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(doc.processing_status)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
