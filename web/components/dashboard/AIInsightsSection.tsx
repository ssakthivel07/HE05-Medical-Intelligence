"use client"

import Link from 'next/link'
import type { DuplicateTestAlert, InconsistencyAlert, TimelineInsight } from '../../lib/types'

interface AIInsightsSectionProps {
  duplicateAlerts: DuplicateTestAlert[]
  inconsistencies: InconsistencyAlert[]
  insights: TimelineInsight[]
}

export default function AIInsightsSection({
  duplicateAlerts,
  inconsistencies,
  insights,
}: AIInsightsSectionProps) {
  const hasAlerts = duplicateAlerts.length > 0 || inconsistencies.length > 0
  const hasInsights = insights.length > 0

  if (!hasAlerts && !hasInsights) {
    return null
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              AI Health Intelligence & Document Insights
            </h3>
            <p className="text-xs text-zinc-500">
              Pattern understanding, test duplication checks, and dosage consistency
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full self-start sm:self-auto">
          AI Document Assistance
        </span>
      </div>

      {/* Clinical Alerts Area */}
      {hasAlerts && (
        <div className="space-y-3">
          {/* Duplicate Test Alerts */}
          {duplicateAlerts.map((dup, i) => (
            <div
              key={`dup-${i}`}
              className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Recent Test Notice
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">
                      ({dup.daysApart} days prior)
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {dup.testType}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                    {dup.message}
                  </p>
                </div>
              </div>

              {dup.previousDocumentId && (
                <Link
                  href={`/api/documents/${dup.previousDocumentId}/view`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-white border border-amber-300 hover:bg-amber-100 dark:bg-zinc-800 dark:border-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl self-start sm:self-center shrink-0 transition"
                >
                  Review Prior Test →
                </Link>
              )}
            </div>
          ))}

          {/* Inconsistencies / Dosage Conflicts */}
          {inconsistencies.map((inc, i) => (
            <div
              key={`inc-${i}`}
              className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Clinical Document Inconsistency
                  </span>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {inc.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                    {inc.description}
                  </p>
                  <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300 mt-1">
                    {inc.suggestedAction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {inc.firstDoc.id && (
                  <Link
                    href={`/api/documents/${inc.firstDoc.id}/view`}
                    target="_blank"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 dark:bg-zinc-800 dark:text-rose-300 hover:underline"
                  >
                    Doc 1
                  </Link>
                )}
                {inc.secondDoc.id && (
                  <Link
                    href={`/api/documents/${inc.secondDoc.id}/view`}
                    target="_blank"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 dark:bg-zinc-800 dark:text-rose-300 hover:underline"
                  >
                    Doc 2
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Longitudinal Timeline Insights Grid */}
      {hasInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {insights.map((ins, i) => {
            const isCaution = ins.significance === 'caution'
            const isSuccess = ins.significance === 'success'

            return (
              <div
                key={`ins-${i}`}
                className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCaution
                          ? 'bg-amber-500'
                          : isSuccess
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    {ins.title}
                  </h4>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {ins.summary}
                </p>
                {ins.relatedDocumentIds && ins.relatedDocumentIds.length > 0 && (
                  <div className="pt-1">
                    <Link
                      href={`/api/documents/${ins.relatedDocumentIds[0]}/view`}
                      target="_blank"
                      className="text-[11px] font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      View Source Document →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Safety Notice */}
      <div className="pt-2 text-[11px] text-zinc-400 dark:text-zinc-500 italic">
        * AI intelligence assistance reflects automated parsing of uploaded documents. It does not provide clinical diagnosis. Always consult with a licensed physician.
      </div>
    </div>
  )
}
