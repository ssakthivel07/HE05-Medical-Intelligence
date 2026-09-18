"use client"

import Link from 'next/link'
import type { PatientProfile } from '../../lib/types'
import ProfileSwitcher from '../patient/ProfileSwitcher'
import ReminderCenter from '../reminders/ReminderCenter'

interface HeaderProps {
  patientName: string
  userEmail?: string
  activePatient?: PatientProfile | null
  allProfiles?: PatientProfile[]
  onMenuToggle?: () => void
  onOpenSearch?: () => void
  onOpenVoiceAssistant?: () => void
}

export default function Header({
  patientName,
  userEmail,
  activePatient,
  allProfiles = [],
  onMenuToggle,
  onOpenSearch,
  onOpenVoiceAssistant,
}: HeaderProps) {
  const initial = patientName ? patientName.trim().charAt(0).toUpperCase() : 'P'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu toggle */}
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex md:hidden items-center justify-center p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 focus:outline-none"
            aria-label="Toggle navigation drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Profile Switcher (Active Patient Indicator & Switcher) */}
        {activePatient && allProfiles.length > 0 ? (
          <ProfileSwitcher currentPatient={activePatient} allProfiles={allProfiles} />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              +
            </div>
            <span className="font-bold text-sm text-zinc-900 dark:text-white">
              {patientName}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Search, Voice Assistant, Reminder Center, User Profile, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-400 transition"
            title="Search across medical records (Cmd+K)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search records...</span>
            <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Mobile Search Icon */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex sm:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Search records"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        {/* AI Voice Assistant Trigger */}
        {onOpenVoiceAssistant && (
          <button
            type="button"
            onClick={onOpenVoiceAssistant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-300 text-xs font-semibold transition"
            title="Ask AI Voice & Text Assistant"
          >
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <span className="hidden md:inline">Voice Assistant</span>
          </button>
        )}

        {/* Reminder Center Popover */}
        <ReminderCenter activePatientId={activePatient ? String(activePatient.id) : undefined} />

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/40">
            {initial}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[120px]">
              {patientName}
            </span>
            {userEmail && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight truncate max-w-[120px]">
                {userEmail}
              </span>
            )}
          </div>
        </div>

        {/* Logout */}
        <Link
          href="/logout"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 rounded-xl transition"
          title="Sign out of your account"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </Link>
      </div>
    </header>
  )
}
