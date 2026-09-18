"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MedicalDocument } from '../../lib/types'
import DocumentInsightsModal from './DocumentInsightsModal'

interface DocumentListProps {
  documents: MedicalDocument[]
  onOpenUpload: () => void
}

export default function DocumentList({ documents, onOpenUpload }: DocumentListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [dateFilter, setDateFilter] = useState<string>('All')
  const [currentTime] = useState(() => Date.now())
  const [processingId, setProcessingId] = useState<string | number | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})
  const [insightsDocId, setInsightsDocId] = useState<string | number | null>(null)
  const [isInsightsOpen, setIsInsightsOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const DOCUMENT_CATEGORIES = [
    'All',
    'Lab Report',
    'Prescription',
    'Discharge Summary',
    'Diagnostic Scan',
    'Clinical Note',
    'Other',
  ]

  // Filter documents by search, category, status, and date range
  const filteredDocs = documents
    .map((d) => ({
      ...d,
      processing_status: localStatuses[String(d.id)] || d.processing_status,
    }))
    .filter((doc) => {
      // Category filter
      const matchesType =
        selectedType === 'All' ||
        doc.document_type.toLowerCase() === selectedType.toLowerCase() ||
        (selectedType === 'Other' &&
          !['lab report', 'prescription', 'discharge summary', 'diagnostic scan', 'clinical note'].includes(
            doc.document_type.toLowerCase()
          ))

      // Status filter
      const matchesStatus =
        selectedStatus === 'All' ||
        doc.processing_status.toLowerCase() === selectedStatus.toLowerCase() ||
        (selectedStatus === 'failed' && ['failed', 'processing_failed', 'error'].includes(doc.processing_status.toLowerCase()))

      // Date filter
      let matchesDate = true
      if (dateFilter !== 'All') {
        const docDate = new Date(doc.document_date).getTime()
        const now = currentTime
        const daysAgo = (now - docDate) / (1000 * 60 * 60 * 24)
        if (dateFilter === '30days' && daysAgo > 30) matchesDate = false
        if (dateFilter === '90days' && daysAgo > 90) matchesDate = false
        if (dateFilter === '1year' && daysAgo > 365) matchesDate = false
      }

      // Search query
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        doc.file_name.toLowerCase().includes(query) ||
        (doc.hospital_name && doc.hospital_name.toLowerCase().includes(query)) ||
        (doc.doctor_name && doc.doctor_name.toLowerCase().includes(query)) ||
        doc.document_type.toLowerCase().includes(query)

      return matchesType && matchesStatus && matchesDate && matchesSearch
    })

  const handleProcessDocument = async (docId: string | number) => {
    setActionError(null)
    setProcessingId(docId)
    setLocalStatuses((prev) => ({ ...prev, [String(docId)]: 'processing' }))

    try {
      const res = await fetch(`/api/documents/${docId}/process`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract medical intelligence.')
      }

      setLocalStatuses((prev) => ({ ...prev, [String(docId)]: 'processed' }))
      router.refresh()

      // Open insights
      setInsightsDocId(docId)
      setIsInsightsOpen(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed'
      setActionError(msg)
      setLocalStatuses((prev) => ({ ...prev, [String(docId)]: 'processing_failed' }))
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteDocument = async (docId: string | number, fileName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${fileName}" and its extracted timeline events?`)) {
      return
    }

    setActionError(null)
    setDeletingId(docId)

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete document.')
      }

      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed'
      setActionError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'processed' || s === 'completed' || s === 'ready') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Processed
        </span>
      )
    }
    if (s === 'uploaded') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Uploaded
        </span>
      )
    }
    if (s === 'processing' || s === 'analyzing') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          Extracting AI...
        </span>
      )
    }
    if (s === 'failed' || s === 'processing_failed' || s === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Extraction Failed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        {status || 'Uploaded'}
      </span>
    )
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
    if (ext === '.pdf') {
      return (
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/50 font-bold text-[10px]">
          PDF
        </div>
      )
    }
    if (ext === '.doc' || ext === '.docx') {
      return (
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50 font-bold text-[10px]">
          DOC
        </div>
      )
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50 font-bold text-[10px]">
        {ext === '.webp' ? 'WEBP' : 'IMG'}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
          No medical documents on file for this patient
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Upload diagnostic lab results, prescriptions, surgical notes, or imaging scans to begin building a unified chronological timeline.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Medical Document
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 text-xs sm:text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="font-bold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Filter Bar: Search, Category, Status, Date */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by filename, doctor, facility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-100"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {/* Document Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            {DOCUMENT_CATEGORIES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Types' : t}
              </option>
            ))}
          </select>

          {/* Processing Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="processed">Processed</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="All">Any Time</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Past Year</option>
          </select>
        </div>
      </div>

      {/* Results Count & Clear */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
        <span>
          Showing {filteredDocs.length} of {documents.length} document(s)
        </span>
        {(searchQuery || selectedType !== 'All' || selectedStatus !== 'All' || dateFilter !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedType('All')
              setSelectedStatus('All')
              setDateFilter('All')
            }}
            className="text-blue-600 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Document Items List */}
      {filteredDocs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No medical documents match your current filter settings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isProcessingThis = processingId === doc.id || doc.processing_status === 'processing'
            const isDeletingThis = deletingId === doc.id
            const isProcessed = doc.processing_status === 'processed'
            const isFailed = doc.processing_status === 'failed' || doc.processing_status === 'processing_failed'
            const dateStr = doc.document_date
              ? new Date(doc.document_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown date'

            const hospitalOrDoctor = [doc.doctor_name, doc.hospital_name].filter(Boolean).join(' • ')

            return (
              <div
                key={doc.id}
                className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {getFileIcon(doc.file_name)}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                        {doc.file_name}
                      </h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
                        {doc.document_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dateStr}
                      </span>

                      {hospitalOrDoctor && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[280px]">{hospitalOrDoctor}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 flex-wrap">
                  <div>{getStatusBadge(doc.processing_status)}</div>

                  {/* AI Insights Action */}
                  {isProcessed && (
                    <button
                      type="button"
                      onClick={() => {
                        setInsightsDocId(doc.id)
                        setIsInsightsOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 transition"
                      title="Inspect extracted findings, events, medications, and source citations"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Insights
                    </button>
                  )}

                  {/* Extract / Retry Button */}
                  {isFailed && (
                    <button
                      type="button"
                      disabled={isProcessingThis}
                      onClick={() => handleProcessDocument(doc.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-2xs disabled:opacity-50"
                      title="Retry automated document intelligence extraction"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isProcessingThis ? 'Retrying...' : 'Retry Extraction'}
                    </button>
                  )}

                  {!isProcessed && !isFailed && (
                    <button
                      type="button"
                      disabled={isProcessingThis}
                      onClick={() => handleProcessDocument(doc.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                        isProcessingThis
                          ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900'
                      }`}
                      title="Run automated document intelligence extraction"
                    >
                      {isProcessingThis ? 'Extracting...' : 'Extract with AI'}
                    </button>
                  )}

                  {/* View Raw Document */}
                  <a
                    href={`/api/documents/${doc.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition"
                    title="Open temporary signed link"
                  >
                    View
                  </a>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isDeletingThis}
                    onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Delete document and extracted events"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Insights Modal */}
      <DocumentInsightsModal
        documentId={insightsDocId}
        isOpen={isInsightsOpen}
        onClose={() => {
          setIsInsightsOpen(false)
          setInsightsDocId(null)
        }}
      />
    </div>
  )
}
