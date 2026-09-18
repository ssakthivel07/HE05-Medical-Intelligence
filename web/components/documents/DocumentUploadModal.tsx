"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { validateDocumentFile } from '../../lib/supabase/storage'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  activePatientId?: string
}

const DOCUMENT_TYPES = [
  'Lab Report',
  'Prescription',
  'Discharge Summary',
  'Diagnostic Scan',
  'Clinical Note',
  'Other',
]

export default function DocumentUploadModal({
  isOpen,
  onClose,
  activePatientId,
}: DocumentUploadModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('Lab Report')
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().slice(0, 10))
  const [hospitalName, setHospitalName] = useState('')
  const [doctorName, setDoctorName] = useState('')

  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)

  if (!isOpen) return null

  const handleFileSelection = (selectedFile: File | undefined) => {
    if (!selectedFile) return
    setError(null)
    setSuccess(null)

    const validationMsg = validateDocumentFile({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    })

    if (validationMsg) {
      setError(validationMsg)
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current || uploading) return
    if (!file) {
      setError('Please select a medical document to upload.')
      return
    }

    isSubmittingRef.current = true
    setError(null)
    setSuccess(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType)
      formData.append('document_date', documentDate)
      if (activePatientId) formData.append('patient_id', activePatientId)
      if (hospitalName.trim()) formData.append('hospital_name', hospitalName.trim())
      if (doctorName.trim()) formData.append('doctor_name', doctorName.trim())

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || 'Document upload failed. Please try again.')
      } else {
        setSuccess('Document uploaded securely!')
        setFile(null)
        setHospitalName('')
        setDoctorName('')
        if (fileInputRef.current) fileInputRef.current.value = ''

        router.refresh()

        setTimeout(() => {
          onClose()
          setSuccess(null)
        }, 1000)
      }
    } catch {
      setError('A network error occurred while uploading. Please check connection.')
    } finally {
      setUploading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => !uploading && onClose()}
      />

      {/* Modal container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 z-10 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">
                Upload Medical Document
              </h3>
              <p className="text-xs text-zinc-500">
                Encrypted and protected under private storage
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Select Document File <span className="text-red-500">*</span>
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFileSelection(e.dataTransfer.files[0])
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/10'
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleFileSelection(e.target.files?.[0])}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[240px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(file.size)} • Click to change file
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <svg
                    className="mx-auto w-8 h-8 text-zinc-400 dark:text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    PDF, Images (JPG, PNG, WEBP), Word (.doc, .docx) • Maximum 15 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc_type" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Document Classification <span className="text-red-500">*</span>
              </label>
              <select
                id="doc_type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                required
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc_date" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Document Date <span className="text-red-500">*</span>
              </label>
              <input
                id="doc_date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
          </div>

          {/* Facility & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="hospital_name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Hospital / Facility (Optional)
              </label>
              <input
                id="hospital_name"
                type="text"
                placeholder="e.g. City General Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label htmlFor="doctor_name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Doctor / Attending Specialist (Optional)
              </label>
              <input
                id="doctor_name"
                type="text"
                placeholder="e.g. Dr. Rebecca Adams"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={uploading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {uploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading Encrypted File…
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
