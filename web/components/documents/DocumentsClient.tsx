"use client"

import { useState } from 'react'
import Link from 'next/link'
import type { MedicalDocument } from '../../lib/types'
import DocumentList from './DocumentList'
import DocumentUploadModal from './DocumentUploadModal'

interface DocumentsClientProps {
  documents: MedicalDocument[]
  activePatientId?: string
}

export default function DocumentsClient({ documents, activePatientId }: DocumentsClientProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <span className="text-xs text-zinc-400 font-medium">
          Protected Health Information (PHI)
        </span>
      </div>

      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Document Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Centralized document hub for laboratory tests, imaging scans, discharge summaries, and prescriptions. All files are private with signed link security.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </button>
        </div>
      </div>

      {/* Document List Component */}
      <DocumentList
        documents={documents}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        activePatientId={activePatientId}
      />
    </div>
  )
}
