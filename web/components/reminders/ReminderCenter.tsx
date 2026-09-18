"use client"

import { useState, useEffect, useRef } from 'react'
import type { Reminder } from '../../lib/types'

interface ReminderCenterProps {
  activePatientId?: string
}

export default function ReminderCenter({ activePatientId }: ReminderCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch reminders on mount or active patient change
  useEffect(() => {
    async function loadReminders() {
      setLoading(true)
      try {
        const url = `/api/reminders${activePatientId ? `?patientId=${activePatientId}` : ''}`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setReminders(data.reminders || [])
        }
      } catch (err) {
        console.error('Error fetching reminders:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReminders()
  }, [activePatientId])

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotificationPermission(perm)
      if (perm === 'granted') {
        new Notification('Medical Timeline Notifications Enabled', {
          body: 'You will receive reminders for medication doses and upcoming clinical appointments.',
          icon: '/favicon.ico',
        })
      }
    }
  }

  const markCompleted = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  const pendingReminders = reminders.filter((r) => !r.is_completed)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition"
        aria-label="View notifications and medical reminders"
        title="Reminder Center"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {pendingReminders.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
            {pendingReminders.length}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-white">
                Reminder Center
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {pendingReminders.length} active
              </span>
            </div>

            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto space-y-2.5">
            {loading && (
              <div className="py-6 text-center text-xs text-zinc-400">Loading reminders...</div>
            )}

            {!loading && pendingReminders.length === 0 && (
              <div className="py-6 text-center text-xs text-zinc-500">
                All caught up! No pending medication or appointment reminders.
              </div>
            )}

            {!loading &&
              pendingReminders.map((r) => {
                const isMed = r.category === 'medication'
                return (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isMed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {isMed ? 'Rx' : 'CAL'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {r.title}
                        </p>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {new Date(r.scheduled_time).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => markCompleted(r.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition shrink-0"
                      title="Mark reminder as completed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                )
              })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 block">
              Reminders derived from prescriptions and upcoming visits
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
