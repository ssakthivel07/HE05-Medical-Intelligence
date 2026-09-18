'use client'

import { useState, useMemo } from 'react'
import type { Appointment } from '../../lib/types'
import AddAppointmentModal from './AddAppointmentModal'

interface AppointmentsClientProps {
  initialAppointments: Appointment[]
  patientName: string
}

export default function AppointmentsClient({
  initialAppointments,
  patientName,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past' | 'all'>('upcoming')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentTime] = useState(() => Date.now())
  const todayStart = useMemo(() => {
    const d = new Date(currentTime)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  }, [currentTime])
  const todayEnd = todayStart + 24 * 60 * 60 * 1000

  // Categorize appointments
  const { todayList, upcomingList, pastList } = useMemo(() => {
    const today: Appointment[] = []
    const upcoming: Appointment[] = []
    const past: Appointment[] = []

    for (const appt of appointments) {
      const apptTime = new Date(appt.appointment_date).getTime()
      if (apptTime >= todayStart && apptTime < todayEnd) {
        today.push(appt)
      } else if (apptTime >= todayEnd) {
        upcoming.push(appt)
      } else {
        past.push(appt)
      }
    }

    // Sort upcoming ascending, past descending
    upcoming.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    past.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())

    return { todayList: today, upcomingList: upcoming, pastList: past }
  }, [appointments, todayStart, todayEnd])

  // Filter based on active tab
  const tabAppointments = useMemo(() => {
    let list: Appointment[] = []
    if (activeTab === 'today') list = todayList
    else if (activeTab === 'upcoming') list = upcomingList
    else if (activeTab === 'past') list = pastList
    else list = appointments

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (a) =>
        (a.doctor_name && a.doctor_name.toLowerCase().includes(q)) ||
        (a.hospital_name && a.hospital_name.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q))
    )
  }, [activeTab, todayList, upcomingList, pastList, appointments, searchQuery])

  async function handleDelete(appt: Appointment) {
    if (!confirm(`Cancel appointment with ${appt.doctor_name || 'physician'}?`)) {
      return
    }

    setDeletingId(appt.id)
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== appt.id))
      } else {
        alert('Failed to delete appointment.')
      }
    } catch {
      alert('Error cancelling appointment.')
    } finally {
      setDeletingId(null)
    }
  }

  // Format relative time badge
  const getRelativeBadge = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - currentTime
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return { text: 'Today', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300' }
    }
    if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300' }
    }
    if (diffDays > 1) {
      return { text: `In ${diffDays} days`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' }
    }
    const pastDays = Math.abs(diffDays)
    return { text: `${pastDays} days ago`, color: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Clinical Schedules • {patientName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Appointments & Visits
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage upcoming physician consultations, specialist checkups, and diagnostic review visits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Schedule Appointment
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Upcoming Visits ({upcomingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'today'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Today ({todayList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'past'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Past Consultations ({pastList.length})
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
            All ({appointments.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search doctor or clinic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Appointments List */}
      {tabAppointments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {activeTab === 'today'
              ? 'No appointments scheduled for today'
              : activeTab === 'upcoming'
              ? 'No upcoming visits scheduled'
              : 'No appointments found'}
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? 'No appointments match your search criteria.'
              : 'Schedule upcoming physician consultations, specialist reviews, or diagnostic appointments to receive automated reminders.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Schedule Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tabAppointments.map((appt) => {
            const dateObj = new Date(appt.appointment_date)
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const formattedTime = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const badge = getRelativeBadge(appt.appointment_date)

            return (
              <div
                key={appt.id}
                className="p-5 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                      👨‍⚕️
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                        {appt.doctor_name || 'Physician Consultation'}
                      </h3>
                      {appt.hospital_name && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {appt.hospital_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.color}`}
                  >
                    {badge.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 rounded-xl">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {formattedDate} at {formattedTime}
                  </span>
                </div>

                {appt.notes && (
                  <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                    <span className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Notes / Instructions:
                    </span>
                    {appt.notes}
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400">
                    ID: {appt.id.slice(0, 8)}...
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(appt)}
                    disabled={deletingId === appt.id}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>{deletingId === appt.id ? 'Cancelling...' : 'Cancel Visit'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newAppt) => {
          setAppointments((prev) => [...prev, newAppt])
        }}
      />
    </div>
  )
}
