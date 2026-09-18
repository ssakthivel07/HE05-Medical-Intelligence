'use client'

import { useState } from 'react'
import type { FamilyPermission } from '../../lib/types'

interface GrantAccessModalProps {
  isOpen: boolean
  onClose: () => void
  onGranted: (permission: FamilyPermission) => void
  patientName: string
}

export default function GrantAccessModal({
  isOpen,
  onClose,
  onGranted,
  patientName,
}: GrantAccessModalProps) {
  const [delegateId, setDelegateId] = useState('')
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit' | 'full'>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!delegateId.trim()) {
      setError('Please provide a delegate user ID or email.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: delegateId.trim(),
          permission_level: permissionLevel,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to grant access')
      }

      onGranted(data.permission)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error granting access')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Grant Caregiver Access
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Authorize a family member, trusted guardian, or physician for {patientName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Delegate User Identifier / UUID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. usr_caregiver_mom or UUID"
              value={delegateId}
              onChange={(e) => setDelegateId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Enter the authenticated User ID of your family member or caregiver.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
              Permission Level
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setPermissionLevel('view')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  permissionLevel === 'view'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-700'
                    : 'border-zinc-200 dark:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="perm"
                  checked={permissionLevel === 'view'}
                  onChange={() => setPermissionLevel('view')}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">
                    View-Only (Read Access)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Can inspect medical timeline, active medicines, documents, and upcoming appointments. Cannot edit or delete records.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPermissionLevel('edit')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  permissionLevel === 'edit'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-700'
                    : 'border-zinc-200 dark:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="perm"
                  checked={permissionLevel === 'edit'}
                  onChange={() => setPermissionLevel('edit')}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">
                    Editor (Contributor Access)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Can upload medical documents, schedule appointments, and update medication logs on behalf of the patient.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPermissionLevel('full')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  permissionLevel === 'full'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-700'
                    : 'border-zinc-200 dark:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="perm"
                  checked={permissionLevel === 'full'}
                  onChange={() => setPermissionLevel('full')}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">
                    Full Delegate (Co-Manager)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Full administrative privileges, including modifying patient demographics and delegating access to other caregivers.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? 'Granting Access...' : 'Confirm Access Grant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
