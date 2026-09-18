"use client"

import { useEffect, useState } from 'react'
import type { MedicalDocument, MedicalEvent, Medication } from '../../lib/types'

interface DocumentInsightsModalProps {
  documentId: string | number | null
  isOpen: boolean
  onClose: () => void
}

interface InsightsData {
  document: MedicalDocument
  events: MedicalEvent[]
  medications: Medication[]
  evidence?: { id: string; event_id?: string; page_number: number; evidence_text: string }[]
  summary?: string
  questions?: string[]
  importantDates?: { label: string; date: string }[]
  disclaimer?: string
}

export default function DocumentInsightsModal({
  documentId,
  isOpen,
  onClose,
}: DocumentInsightsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<InsightsData | null>(null)
  const [activeTab, setActiveTab] = useState<
    'summary' | 'events' | 'medications' | 'dates' | 'questions' | 'evidence'
  >('summary')

  const handleClose = () => {
    setData(null)
    setError(null)
    onClose()
  }

  useEffect(() => {
    if (!isOpen || !documentId) return

    let isMounted = true
    const fetchInsights = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/documents/${documentId}/insights`)
        if (!res.ok) throw new Error('Failed to load document intelligence data.')
        const json = await res.json()

        if (!isMounted) return
        if (json.ok) {
          setData(json)
          setActiveTab('summary')
        } else {
          setError(json.error || 'Failed to load intelligence data.')
        }
      } catch (err: unknown) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Error fetching document insights.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchInsights()

    return () => {
      isMounted = false
    }
  }, [isOpen, documentId])

  if (!isOpen) return null

  const doc = data?.document
  const events = data?.events || []
  const medications = data?.medications || []
  const questions = data?.questions || []
  const importantDates = data?.importantDates || []

  const parseEvidence = (description?: string | null) => {
    if (!description) return { mainText: '', evidenceText: '', pageNumber: 1 }
    const match = description.match(/\[Evidence - Page (\d+)\]:\s*"([^"]+)"/)
    if (match) {
      const pageNumber = parseInt(match[1], 10)
      const evidenceText = match[2]
      const mainText = description.replace(/\[Evidence - Page \d+\]:\s*"[^"]+"/, '').trim()
      return { mainText, evidenceText, pageNumber }
    }
    return { mainText: description, evidenceText: '', pageNumber: 1 }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900">
                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Document Intelligence
              </span>
              <span className="text-xs text-zinc-400 font-medium">Traceable Evidence</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white truncate max-w-md sm:max-w-xl">
              {doc?.file_name || 'Document Insights'}
            </h2>

            {doc && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {[doc.document_type, doc.hospital_name, doc.doctor_name, doc.document_date].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-2 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            Summary
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'events'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            Key Findings ({events.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medications')}
            className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'medications'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            Medications ({medications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dates')}
            className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'dates'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            Dates ({importantDates.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            Questions for Doctor ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`pb-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            Source Evidence
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Loading structured clinical intelligence...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-sm dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* 1. Summary Tab */}
          {!loading && !error && activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 space-y-2">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  AI Summary Overview
                </span>
                <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm">
                  {data?.summary || 'No summary available.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">Document Class</span>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {doc?.document_type}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">Identified Events</span>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {events.length} Clinical Event(s)
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">Medications Extracted</span>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {medications.length} Prescription(s)
                  </p>
                </div>
              </div>

              {data?.disclaimer && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300 leading-relaxed italic">
                  <strong>Notice:</strong> {data.disclaimer}
                </div>
              )}
            </div>
          )}

          {/* 2. Key Findings & Events */}
          {!loading && !error && activeTab === 'events' && (
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No discrete medical findings or laboratory indices identified.
                </div>
              ) : (
                events.map((ev) => {
                  const { mainText, evidenceText, pageNumber } = parseEvidence(ev.description)
                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                          {ev.event_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-zinc-400">{ev.event_date}</span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{ev.title}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {mainText}
                      </p>
                      {evidenceText && (
                        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-[11px] font-mono text-blue-800 dark:text-blue-300">
                          <strong>Page {pageNumber} Snippet:</strong> &ldquo;{evidenceText}&rdquo;
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* 3. Medications */}
          {!loading && !error && activeTab === 'medications' && (
            <div className="space-y-3">
              {medications.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No medications were identified in this document.
                </div>
              ) : (
                medications.map((med) => (
                  <div
                    key={med.id}
                    className="p-4 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {med.medicine_name}
                      </h4>
                      {med.dosage && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {med.dosage}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">Frequency: {med.frequency || 'As directed'}</p>
                    <p className="text-xs text-zinc-500">Duration: {med.duration || 'Ongoing'}</p>
                    {med.instructions && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 italic pt-1">
                        Instructions: {med.instructions}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. Important Dates */}
          {!loading && !error && activeTab === 'dates' && (
            <div className="space-y-2.5">
              {importantDates.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">No dates recorded.</div>
              ) : (
                importantDates.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {item.label}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">{item.date}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. Questions for Doctor */}
          {!loading && !error && activeTab === 'questions' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 mb-2">
                Recommended clinical questions to discuss with your healthcare provider based on this document:
              </p>
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/50 flex items-start gap-2.5 text-xs text-purple-950 dark:text-purple-200"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="font-medium leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          )}

          {/* 6. Source Evidence Citations */}
          {!loading && !error && activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every extracted finding and prescription maintains granular traceability to the exact page and quote from the original uploaded file.
              </div>

              {data?.evidence && data.evidence.length > 0 ? (
                data.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        Page {ev.page_number}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg italic">
                      &ldquo;{ev.evidence_text}&rdquo;
                    </p>
                  </div>
                ))
              ) : (
                events.map((ev) => {
                  const { evidenceText, pageNumber } = parseEvidence(ev.description)
                  if (!evidenceText) return null
                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          Page {pageNumber}
                        </span>
                        <h5 className="font-bold text-xs text-zinc-900 dark:text-white">{ev.title}</h5>
                      </div>
                      <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg italic">
                        &ldquo;{evidenceText}&rdquo;
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between gap-3">
          {documentId && (
            <a
              href={`/api/documents/${documentId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Inspect Source File (Temporary Signed URL)
            </a>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
