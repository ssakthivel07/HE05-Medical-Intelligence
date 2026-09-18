"use client"

import Link from 'next/link'

interface QuickActionsBarProps {
  onOpenUpload?: () => void
}

export default function QuickActionsBar({ onOpenUpload }: QuickActionsBarProps) {
  const actions = [
    {
      title: 'Upload Document',
      href: '/documents',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      bg: 'bg-blue-600 hover:bg-blue-700 text-white',
      isPrimary: true,
      onClick: onOpenUpload,
    },
    {
      title: 'View Timeline',
      href: '/timeline',
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-purple-50 dark:bg-zinc-900 dark:hover:bg-purple-950/30 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800',
    },
    {
      title: 'View Medicines',
      href: '/medicines',
      icon: (
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-emerald-50 dark:bg-zinc-900 dark:hover:bg-emerald-950/30 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800',
    },
    {
      title: 'Add Appointment',
      href: '/appointments',
      icon: (
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-amber-950/30 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800',
    },
    {
      title: 'Manage Family',
      href: '/family',
      icon: (
        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-indigo-50 dark:bg-zinc-900 dark:hover:bg-indigo-950/30 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800',
    },
    {
      title: 'View Profile',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800',
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Quick Actions
        </h3>
        <span className="text-[11px] text-zinc-400">One-click workflows</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => (
          <Link
            key={act.title}
            href={act.href}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition shadow-2xs group ${act.bg}`}
          >
            <div className="p-2 rounded-xl group-hover:scale-105 transition-transform">
              {act.icon}
            </div>
            <span className="text-xs font-bold tracking-tight leading-tight">
              {act.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
