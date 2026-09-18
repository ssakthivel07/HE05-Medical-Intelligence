'use client'

import { useState } from 'react'
import type { FamilyPermission } from '../../lib/types'
import GrantAccessModal from './GrantAccessModal'

interface FamilyClientProps {
  initialPermissions: FamilyPermission[]
  patientName: string
  patientId: string
  isOwner: boolean
}

export default function FamilyClient({
  initialPermissions,
  patientName,
  patientId,
  isOwner,
}: FamilyClientProps) {
  const [permissions, setPermissions] = useState<FamilyPermission[]>(initialPermissions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function handleRevoke(perm: FamilyPermission) {
    if (!confirm(`Revoke caregiver access for delegate ${perm.user_id}?`)) {
      return
    }

    setRevokingId(perm.id)
    try {
      const res = await fetch(`/api/family/${perm.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPermissions((prev) => prev.filter((p) => p.id !== perm.id))
      } else {
        alert('Failed to revoke permission.')
      }
    } catch {
      alert('Error communicating with server.')
    } finally {
      setRevokingId(null)
    }
  }

  const getBadgeStyle = (level: string) => {
    if (level === 'full') {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900'
    }
    if (level === 'edit') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
    }
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Caregiver Governance • {patientName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Family & Caregiver Access
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Control granular healthcare permissions for family members, authorized caregivers, and clinical advocates.
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Grant Caregiver Access
          </button>
        )}
      </div>

      {/* Security / Privacy Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 text-xs sm:text-sm text-blue-950 dark:text-blue-300 flex items-start gap-3 shadow-xs">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div className="space-y-1">
          <span className="font-bold block">Strict Database Isolation & Row Level Security</span>
          <p className="text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
            Delegates can access health records only through strict database policies verified on every query. Every view, upload, and update is immutably logged to the audit ledger for patient protection.
          </p>
        </div>
      </div>

      {/* Active Delegates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Authorized Delegates ({permissions.length})
          </h2>
          <span className="text-xs text-zinc-400">
            Profile ID: <span className="font-mono">{patientId.slice(0, 8)}...</span>
          </span>
        </div>

        {permissions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              No caregiver delegates configured
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Only you currently have access to {patientName}&apos;s medical records. You can grant view-only or editor access to trusted family members or healthcare advocates.
            </p>
            {isOwner && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Grant Caregiver Access
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map((perm) => (
              <div
                key={perm.id}
                className="p-5 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                      👤
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-mono truncate max-w-[200px] sm:max-w-xs">
                        {perm.user_id}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Granted on{' '}
                        {perm.created_at
                          ? new Date(perm.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getBadgeStyle(
                      perm.permission_level
                    )}`}
                  >
                    {perm.permission_level} Access
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400">
                    Scope: {patientName}
                  </span>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(perm)}
                      disabled={revokingId === perm.id}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>{revokingId === perm.id ? 'Revoking...' : 'Revoke Access'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Matrix Explanation Card */}
      <div className="p-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-white">
          Access Level Capabilities & Permissions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Capability</th>
                <th className="pb-3 font-semibold text-center">View-Only</th>
                <th className="pb-3 font-semibold text-center">Editor</th>
                <th className="pb-3 font-semibold text-center">Full Delegate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="py-2.5">Inspect Medical Timeline & Events</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5">View Documents via Secure Signed URLs</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5">Upload Documents & Trigger AI Extraction</td>
                <td className="py-2.5 text-center text-zinc-300 dark:text-zinc-700">—</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5">Schedule Appointments & Log Medications</td>
                <td className="py-2.5 text-center text-zinc-300 dark:text-zinc-700">—</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5">Manage Caregivers & Delegate Permissions</td>
                <td className="py-2.5 text-center text-zinc-300 dark:text-zinc-700">—</td>
                <td className="py-2.5 text-center text-zinc-300 dark:text-zinc-700">—</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Access Modal */}
      <GrantAccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGranted={(newPerm) => {
          setPermissions((prev) => [newPerm, ...prev])
        }}
        patientName={patientName}
      />
    </div>
  )
}
