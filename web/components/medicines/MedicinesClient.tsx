'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Medication } from '../../lib/types'
import AddMedicationModal from './AddMedicationModal'

interface MedicinesClientProps {
  initialMedications: Medication[]
  patientName: string
}

export default function MedicinesClient({
  initialMedications,
  patientName,
}: MedicinesClientProps) {
  const [medications, setMedications] = useState<Medication[]>(initialMedications)
  const [activeTab, setActiveTab] = useState<'schedule' | 'active' | 'all'>('schedule')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const todayStr = new Date().toISOString().slice(0, 10)

  // Categorize
  const { activeMeds } = useMemo(() => {
    const active: Medication[] = []

    for (const med of medications) {
      const isEnded = med.end_date && med.end_date.slice(0, 10) < todayStr
      if (!isEnded) {
        active.push(med)
      }
    }
    return { activeMeds: active }
  }, [medications, todayStr])

  // Filter based on search query
  const filterMeds = (list: Medication[]) => {
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (m) =>
        m.medicine_name.toLowerCase().includes(q) ||
        m.dosage?.toLowerCase().includes(q) ||
        m.frequency?.toLowerCase().includes(q)
    )
  }

  // Daily Schedule Slots mapping (Morning, Afternoon, Evening, Bedtime)
  const scheduleSlots = useMemo(() => {
    const morning: Medication[] = []
    const afternoon: Medication[] = []
    const evening: Medication[] = []
    const bedtime: Medication[] = []

    for (const med of activeMeds) {
      const freq = (med.frequency || '').toLowerCase()
      if (freq.includes('morning') || freq.includes('od') || freq.includes('once daily') || freq.includes('twice') || freq.includes('tds') || freq.includes('breakfast')) {
        morning.push(med)
      }
      if (freq.includes('afternoon') || freq.includes('lunch') || freq.includes('tds') || freq.includes('three times') || freq.includes('qds')) {
        afternoon.push(med)
      }
      if (freq.includes('evening') || freq.includes('twice') || freq.includes('night') || freq.includes('tds') || freq.includes('dinner')) {
        evening.push(med)
      }
      if (freq.includes('bedtime') || freq.includes('night') || freq.includes('sleep') || freq.includes('hs')) {
        bedtime.push(med)
      }
      // If it doesn't match any standard keywords, default to morning
      if (
        !freq.includes('morning') &&
        !freq.includes('afternoon') &&
        !freq.includes('evening') &&
        !freq.includes('bedtime') &&
        !freq.includes('twice') &&
        !freq.includes('tds')
      ) {
        morning.push(med)
      }
    }

    return { morning, afternoon, evening, bedtime }
  }, [activeMeds])

  async function handleDelete(med: Medication) {
    if (!confirm(`Are you sure you want to remove "${med.medicine_name}" from your active medications?`)) {
      return
    }

    setDeletingId(med.id)
    try {
      const res = await fetch(`/api/medications/${med.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMedications((prev) => prev.filter((m) => m.id !== med.id))
      } else {
        alert('Failed to delete medication.')
      }
    } catch {
      alert('Error removing medication.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Prescription & Schedule Ledger • {patientName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Medications & Schedule
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Track active prescriptions, daily intake schedules, dosage directions, and historical regimens.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Medication
          </button>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shadow-xs"
          >
            Upload Rx Document
          </Link>
        </div>
      </div>

      {/* Medical Safety Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/50 flex items-start gap-3.5 text-xs sm:text-sm text-amber-900 dark:text-amber-300 shadow-xs">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="space-y-0.5">
          <span className="font-bold block">Important Clinical Safety Notice</span>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-xs">
            Medication schedules and dosage reminders are generated for personal record-keeping only. Always adhere strictly to pharmacy prescription labels and consult your licensed medical physician before starting, stopping, or altering dosages.
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Daily Schedule View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Active Prescriptions ({activeMeds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            All / History ({medications.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab Content: Daily Schedule View */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Today&apos;s Medication Regimen
            </h2>
            <span className="text-xs text-zinc-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Morning Slot */}
            <div className="p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:to-zinc-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
                    ☀️
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Morning</h3>
                    <p className="text-[11px] text-zinc-500">8:00 AM • Breakfast</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {scheduleSlots.morning.length}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-amber-100 dark:border-amber-900/40">
                {scheduleSlots.morning.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">No morning medicines</p>
                ) : (
                  scheduleSlots.morning.map((med) => (
                    <div key={med.id} className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 shadow-2xs space-y-1">
                      <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {med.medicine_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{med.dosage || '1 dose'}</span>
                        <span className="text-blue-600 dark:text-blue-400">{med.duration || 'Daily'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Afternoon Slot */}
            <div className="p-5 rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50/50 to-white dark:border-sky-900/40 dark:from-sky-950/20 dark:to-zinc-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm font-bold">
                    🌤️
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Afternoon</h3>
                    <p className="text-[11px] text-zinc-500">1:00 PM • Lunch</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {scheduleSlots.afternoon.length}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-sky-900/40">
                {scheduleSlots.afternoon.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">No afternoon medicines</p>
                ) : (
                  scheduleSlots.afternoon.map((med) => (
                    <div key={med.id} className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 shadow-2xs space-y-1">
                      <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {med.medicine_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{med.dosage || '1 dose'}</span>
                        <span className="text-blue-600 dark:text-blue-400">{med.duration || 'Daily'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Evening Slot */}
            <div className="p-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 to-white dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-zinc-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                    🌇
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Evening</h3>
                    <p className="text-[11px] text-zinc-500">7:00 PM • Dinner</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {scheduleSlots.evening.length}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                {scheduleSlots.evening.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">No evening medicines</p>
                ) : (
                  scheduleSlots.evening.map((med) => (
                    <div key={med.id} className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 shadow-2xs space-y-1">
                      <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {med.medicine_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{med.dosage || '1 dose'}</span>
                        <span className="text-blue-600 dark:text-blue-400">{med.duration || 'Daily'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bedtime Slot */}
            <div className="p-5 rounded-2xl border border-purple-200/80 bg-gradient-to-b from-purple-50/50 to-white dark:border-purple-900/40 dark:from-purple-950/20 dark:to-zinc-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
                    🌙
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Bedtime</h3>
                    <p className="text-[11px] text-zinc-500">10:00 PM • Sleep</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {scheduleSlots.bedtime.length}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-purple-100 dark:border-purple-900/40">
                {scheduleSlots.bedtime.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">No bedtime medicines</p>
                ) : (
                  scheduleSlots.bedtime.map((med) => (
                    <div key={med.id} className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 shadow-2xs space-y-1">
                      <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {med.medicine_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{med.dosage || '1 dose'}</span>
                        <span className="text-blue-600 dark:text-blue-400">{med.duration || 'Daily'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Active or All Prescriptions Grid */}
      {(activeTab === 'active' || activeTab === 'all') && (
        <div>
          {filterMeds(activeTab === 'active' ? activeMeds : medications).length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                No medications found
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? 'No medications match your search criteria.'
                  : 'Add a new medication manually or upload a prescription document to extract your medicines automatically.'}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Add Medication
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterMeds(activeTab === 'active' ? activeMeds : medications).map((med) => {
                const isActive =
                  (!med.start_date || med.start_date.slice(0, 10) <= todayStr) &&
                  (!med.end_date || med.end_date.slice(0, 10) >= todayStr)

                return (
                  <div
                    key={med.id}
                    className="p-5 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {isActive ? 'Active Prescription' : 'Completed / Past'}
                          </span>
                          <h3 className="font-bold text-base text-zinc-900 dark:text-white mt-1.5">
                            {med.medicine_name}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(med)}
                          disabled={deletingId === med.id}
                          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition"
                          title="Remove medication"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {med.dosage && (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Dosage:</span>
                            <span className="font-mono text-zinc-900 dark:text-white">{med.dosage}</span>
                          </div>
                        )}
                        {med.frequency && (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Frequency:</span>
                            <span className="text-zinc-900 dark:text-white">{med.frequency}</span>
                          </div>
                        )}
                        {med.duration && (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Duration:</span>
                            <span className="text-zinc-900 dark:text-white">{med.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {med.start_date ? `Start: ${med.start_date.slice(0, 10)}` : 'Ongoing'}
                        {med.end_date ? ` • End: ${med.end_date.slice(0, 10)}` : ''}
                      </span>
                      {med.document_id && (
                        <Link
                          href={`/api/documents/${med.document_id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Rx Source</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newMed) => {
          setMedications((prev) => [newMed, ...prev])
        }}
      />
    </div>
  )
}
