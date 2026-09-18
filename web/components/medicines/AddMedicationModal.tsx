'use client'

import { useState } from 'react'
import type { Medication } from '../../lib/types'

interface AddMedicationModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (medication: Medication) => void
}

export default function AddMedicationModal({
  isOpen,
  onClose,
  onAdded,
}: AddMedicationModalProps) {
  const [medicineName, setMedicineName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('Once daily')
  const [customFrequency, setCustomFrequency] = useState('')
  const [duration, setDuration] = useState('Ongoing')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!medicineName.trim()) {
      setError('Please provide a medication name.')
      return
    }

    const resolvedFrequency = frequency === 'Other' ? customFrequency.trim() : frequency

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_name: medicineName.trim(),
          dosage: dosage.trim() || undefined,
          frequency: resolvedFrequency || undefined,
          duration: duration.trim() || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add medication')
      }

      onAdded(data.medication)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding medication')
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
              Add Prescription / Medication
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Record active or recurring medicine regimens for automated schedule tracking.
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
              Medicine Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Metformin, Atorvastatin, Amoxicillin"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Dosage / Strength
              </label>
              <input
                type="text"
                placeholder="e.g. 500mg, 10mg, 1 tab"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 5 days, Ongoing"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Frequency & Schedule Slot
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Once daily (Morning)">Once daily (Morning - 8:00 AM)</option>
              <option value="Once daily (Bedtime)">Once daily (Bedtime - 10:00 PM)</option>
              <option value="Twice daily (Morning & Night)">Twice daily (Morning & Evening)</option>
              <option value="Three times daily (TDS)">Three times daily (TDS)</option>
              <option value="Four times daily">Four times daily (QDS)</option>
              <option value="As needed (SOS / PRN)">As needed (SOS / PRN)</option>
              <option value="Other">Custom Frequency...</option>
            </select>
            {frequency === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom frequency instructions"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                className="mt-2 w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
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
              {loading ? 'Adding Medicine...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
