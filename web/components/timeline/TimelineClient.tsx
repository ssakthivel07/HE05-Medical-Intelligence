'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { MedicalEvent } from '../../lib/types'

interface TimelineClientProps {
  initialEvents: MedicalEvent[]
  patientName: string
}

export default function TimelineClient({
  initialEvents,
  patientName,
}: TimelineClientProps) {
  const [events, setEvents] = useState<MedicalEvent[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [inspectedEvent, setInspectedEvent] = useState<MedicalEvent | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Toggle verified status
  async function toggleVerification(event: MedicalEvent) {
    setUpdatingId(event.id)
    try {
      const newStatus = !event.is_verified
      const res = await fetch(`/api/timeline/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: newStatus }),
      })
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, is_verified: newStatus } : e))
        )
        if (inspectedEvent && inspectedEvent.id === event.id) {
          setInspectedEvent((prev) => (prev ? { ...prev, is_verified: newStatus } : null))
        }
      }
    } catch (err) {
      console.error('Failed to update verification status', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesTitle = ev.title.toLowerCase().includes(q)
          const matchesDesc = ev.description?.toLowerCase().includes(q)
          const matchesType = ev.event_type.toLowerCase().includes(q)
          if (!matchesTitle && !matchesDesc && !matchesType) return false
        }
        // Event type
        if (selectedType !== 'all') {
          if (ev.event_type.toLowerCase() !== selectedType.toLowerCase()) return false
        }
        // Verification
        if (verificationFilter === 'verified' && !ev.is_verified) return false
        if (verificationFilter === 'unverified' && ev.is_verified) return false

        return true
      })
      .sort((a, b) => {
        const timeA = a.event_date ? new Date(a.event_date).getTime() : 0
        const timeB = b.event_date ? new Date(b.event_date).getTime() : 0
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
      })
  }, [events, searchQuery, selectedType, verificationFilter, sortOrder])

  // Group events by Month and Year
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: MedicalEvent[] } = {}
    for (const ev of filteredEvents) {
      const date = ev.event_date ? new Date(ev.event_date) : null
      const groupKey = date
        ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Undated Events'
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(ev)
    }
    return groups
  }, [filteredEvents])

  // Distinct event types
  const availableTypes = useMemo(() => {
    const set = new Set<string>()
    initialEvents.forEach((e) => {
      if (e.event_type) set.add(e.event_type)
    })
    return Array.from(set)
  }, [initialEvents])

  const getEventTypeColor = (type: string) => {
    const lower = type.toLowerCase()
    if (lower.includes('lab') || lower.includes('blood') || lower.includes('test')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900'
    }
    if (lower.includes('prescrip') || lower.includes('med')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
    }
    if (lower.includes('surg') || lower.includes('proced') || lower.includes('discharg')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
    }
    if (lower.includes('scan') || lower.includes('ray') || lower.includes('imaging')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900'
    }
    if (lower.includes('consult') || lower.includes('visit') || lower.includes('appoint')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
    }
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Interactive Health Timeline • {patientName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Medical Timeline
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Consolidated chronological history of clinical visits, lab results, prescriptions, and diagnoses with source document traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Document / Extract
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
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
              placeholder="Search diagnoses, tests, or clinical keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shrink-0"
              title="Toggle Chronological Direction"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <span className="font-semibold text-zinc-400 mr-1">Filter Type:</span>
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full font-medium transition ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            All Types ({events.length})
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full font-medium transition capitalize ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {type}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <span className="font-semibold text-zinc-400 mr-1 hidden sm:inline">Verification:</span>
            <button
              type="button"
              onClick={() => setVerificationFilter('all')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                verificationFilter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setVerificationFilter('verified')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                verificationFilter === 'verified'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => setVerificationFilter('unverified')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                verificationFilter === 'unverified'
                  ? 'bg-amber-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              AI Extracted
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            No matching events found
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {events.length === 0
              ? 'No medical events have been extracted for this patient profile yet. Upload clinical documents to automatically populate the timeline.'
              : 'Try clearing your search query or adjusting your filters to see more medical timeline events.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {events.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedType('all')
                  setVerificationFilter('all')
                }}
                className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                href="/documents"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Go to Documents
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([groupLabel, groupItems]) => (
            <div key={groupLabel} className="space-y-4">
              {/* Group Header Badge */}
              <div className="sticky top-20 z-10 flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
                  {groupLabel}
                </span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-xs text-zinc-400 font-medium">
                  {groupItems.length} {groupItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Group Timeline Entries */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 dark:border-blue-950 space-y-4">
                {groupItems.map((ev) => {
                  const dateStr = ev.event_date
                    ? new Date(ev.event_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Date not specified'

                  return (
                    <div key={ev.id} className="relative group">
                      {/* Timeline bullet dot */}
                      <div
                        className={`absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full bg-white border-4 dark:bg-zinc-900 shadow-xs transition ${
                          ev.is_verified
                            ? 'border-emerald-500'
                            : 'border-blue-600 group-hover:scale-110'
                        }`}
                      />

                      <div className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs transition space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getEventTypeColor(
                                ev.event_type
                              )}`}
                            >
                              {ev.event_type}
                            </span>
                            {ev.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Clinically Verified
                              </span>
                            ) : ev.confidence !== null && ev.confidence !== undefined ? (
                              <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono">
                                AI Confidence: {Math.round(ev.confidence * 100)}%
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs font-medium text-zinc-500">
                            {dateStr}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                            {ev.title}
                          </h3>
                          {ev.description && (
                            <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                              {ev.description}
                            </p>
                          )}
                        </div>

                        {/* Action Toolbar */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setInspectedEvent(ev)}
                              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Inspect Details & Citations
                            </button>

                            {ev.document_id && (
                              <Link
                                href={`/api/documents/${ev.document_id}/view`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 inline-flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Source Document
                              </Link>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleVerification(ev)}
                            disabled={updatingId === ev.id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                              ev.is_verified
                                ? 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {updatingId === ev.id
                              ? 'Updating...'
                              : ev.is_verified
                              ? 'Unverify'
                              : 'Mark as Verified'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Event Detail Drawer / Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getEventTypeColor(
                    inspectedEvent.event_type
                  )}`}
                >
                  {inspectedEvent.event_type}
                </span>
                {inspectedEvent.is_verified ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    Verified
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                    Pending Verification
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {inspectedEvent.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Recorded Date:{' '}
                {inspectedEvent.event_date
                  ? new Date(inspectedEvent.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Undated'}
              </p>
            </div>

            {inspectedEvent.description && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                <span className="font-semibold text-xs text-zinc-400 uppercase tracking-wider block mb-1">
                  Clinical Details & Findings
                </span>
                {inspectedEvent.description}
              </div>
            )}

            {/* AI Traceability & Confidence */}
            <div className="space-y-2 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900 dark:text-blue-300">
                  AI Extraction Confidence
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                  {inspectedEvent.confidence !== null && inspectedEvent.confidence !== undefined
                    ? `${Math.round(inspectedEvent.confidence * 100)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      inspectedEvent.confidence !== null && inspectedEvent.confidence !== undefined
                        ? inspectedEvent.confidence * 100
                        : 75
                    }%`,
                  }}
                />
              </div>
              <p className="text-zinc-500 text-[11px] leading-tight pt-1">
                Extracted from clinical documents using structured vision intelligence. Verify with original medical records.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {inspectedEvent.document_id ? (
                <Link
                  href={`/api/documents/${inspectedEvent.document_id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Source Document
                </Link>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => toggleVerification(inspectedEvent)}
                  disabled={updatingId === inspectedEvent.id}
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${
                    inspectedEvent.is_verified
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {updatingId === inspectedEvent.id
                    ? 'Saving...'
                    : inspectedEvent.is_verified
                    ? 'Mark as Unverified'
                    : 'Verify This Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
