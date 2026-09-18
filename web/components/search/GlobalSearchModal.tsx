"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { MedicalDocument, MedicalEvent, Medication, Appointment } from '../../lib/types'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  activePatientId?: string
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  activePatientId,
}: GlobalSearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [docs, setDocs] = useState<MedicalDocument[]>([])
  const [events, setEvents] = useState<MedicalEvent[]>([])
  const [meds, setMeds] = useState<Medication[]>([])
  const [appts, setAppts] = useState<Appointment[]>([])

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `/api/search?q=${encodeURIComponent(query.trim())}${
          activePatientId ? `&patientId=${activePatientId}` : ''
        }`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setDocs(data.documents || [])
          setEvents(data.events || [])
          setMeds(data.medications || [])
          setAppts(data.appointments || [])
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, activePatientId])

  if (!isOpen) return null

  const isQueryEmpty = !query.trim()
  const displayDocs = isQueryEmpty ? [] : docs
  const displayEvents = isQueryEmpty ? [] : events
  const displayMeds = isQueryEmpty ? [] : meds
  const displayAppts = isQueryEmpty ? [] : appts
  const hasResults = displayDocs.length > 0 || displayEvents.length > 0 || displayMeds.length > 0 || displayAppts.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={handleClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents, timeline events, medications, appointments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-2 py-1 rounded-md text-[11px] font-mono bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {!query.trim() && (
            <div className="py-8 text-center text-xs text-zinc-400">
              Type keywords to search across all records for the active patient profile.
            </div>
          )}

          {query.trim() && !loading && !hasResults && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching medical records found for &quot;{query}&quot;.
            </div>
          )}

          {/* 1. Documents */}
          {displayDocs.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                Documents ({displayDocs.length})
              </h4>
              <div className="space-y-1">
                {displayDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      handleClose()
                      router.push('/documents')
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        DOC
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {doc.file_name}
                        </p>
                        <span className="text-[11px] text-zinc-400">
                          {doc.document_type} • {doc.document_date}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 shrink-0">View →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Timeline Events */}
          {displayEvents.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                Timeline Events ({displayEvents.length})
              </h4>
              <div className="space-y-1">
                {displayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      handleClose()
                      router.push('/timeline')
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">
                        EVT
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {ev.title}
                        </p>
                        <span className="text-[11px] text-zinc-400">
                          {ev.event_type} • {ev.event_date}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-600 shrink-0">Timeline →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Medications */}
          {displayMeds.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                Medications ({displayMeds.length})
              </h4>
              <div className="space-y-1">
                {displayMeds.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => {
                      handleClose()
                      router.push('/medicines')
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        Rx
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {med.medicine_name} {med.dosage ? `(${med.dosage})` : ''}
                        </p>
                        <span className="text-[11px] text-zinc-400">
                          {med.frequency || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 shrink-0">Medicines →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Appointments */}
          {displayAppts.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2">
                Appointments ({displayAppts.length})
              </h4>
              <div className="space-y-1">
                {displayAppts.map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => {
                      handleClose()
                      router.push('/appointments')
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                        CAL
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {appt.doctor_name || 'Consultation'}
                        </p>
                        <span className="text-[11px] text-zinc-400">
                          {appt.hospital_name} • {new Date(appt.appointment_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-600 shrink-0">Visit →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Search scoped to authorized patient records</span>
          <span className="font-mono">Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  )
}
