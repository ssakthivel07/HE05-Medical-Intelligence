"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PatientProfile } from '../../lib/types'
import AddProfileModal from './AddProfileModal'

interface ProfileSwitcherProps {
  currentPatient: PatientProfile
  allProfiles: PatientProfile[]
}

export default function ProfileSwitcher({ currentPatient, allProfiles }: ProfileSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSwitchProfile(targetPatientId: string) {
    if (String(targetPatientId) === String(currentPatient.id)) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/patient-profile/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: targetPatientId }),
      })

      if (res.ok) {
        setIsOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Error switching active profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadDemo() {
    setLoading(true)
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' })
      if (res.ok) {
        setIsOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to load demo data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetDemo() {
    if (!confirm('Remove fictional demo patient and associated demo records?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' })
      if (res.ok) {
        setIsOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to reset demo data:', err)
    } finally {
      setLoading(false)
    }
  }

  const isDemoActive = currentPatient.full_name.toLowerCase().includes('demo')

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 transition text-left shadow-2xs group"
        title="Switch patient profile"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {currentPatient.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col text-left max-w-[140px] sm:max-w-[180px]">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
            {currentPatient.full_name}
          </span>
          <span className="text-[10px] text-zinc-500 capitalize leading-tight">
            {currentPatient.relationship || 'Self'}
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Patient Profiles ({allProfiles.length})
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {allProfiles.map((p) => {
              const isSelected = String(p.id) === String(currentPatient.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSwitchProfile(String(p.id))}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-800 font-bold dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{p.full_name}</p>
                      <span className="text-[10px] text-zinc-400 capitalize block leading-none">
                        {p.relationship || 'Self'}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsAddOpen(true)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Patient Profile</span>
            </button>

            {isDemoActive ? (
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Reset Demo Records</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Load Demo Patient (Ananya Sharma)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  )
}
