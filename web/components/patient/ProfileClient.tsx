'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PatientProfile } from '../../lib/types'
import EditProfileModal from './EditProfileModal'
import AddProfileModal from './AddProfileModal'

interface ProfileClientProps {
  activePatient: PatientProfile
  allProfiles: PatientProfile[]
  userEmail: string
  userId: string
}

export default function ProfileClient({
  activePatient,
  allProfiles,
  userEmail,
  userId,
}: ProfileClientProps) {
  const router = useRouter()
  const [currentPatient, setCurrentPatient] = useState<PatientProfile>(activePatient)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [seedingDemo, setSeedingDemo] = useState(false)

  // Switch active profile
  async function handleSwitch(profileId: string) {
    if (profileId === currentPatient.id) return
    setSwitchingId(profileId)
    try {
      const res = await fetch('/api/patient-profile/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: profileId }),
      })
      if (res.ok) {
        const found = allProfiles.find((p) => p.id === profileId)
        if (found) setCurrentPatient(found)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to switch profile', err)
    } finally {
      setSwitchingId(null)
    }
  }

  // Quick seed demo data
  async function handleSeedDemo() {
    setSeedingDemo(true)
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' })
      if (res.ok) {
        alert('Demo Patient (Ananya Sharma) loaded successfully!')
        router.refresh()
      } else {
        alert('Could not seed demo data.')
      }
    } catch {
      alert('Error connecting to demo seed endpoint.')
    } finally {
      setSeedingDemo(false)
    }
  }

  // Calculate age from DOB
  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return null
    const birthDate = new Date(dobString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge(currentPatient.date_of_birth)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Patient Credentials & Household Profiles
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Patient Profiles & Demographics
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage authenticated medical demographics, blood markers, emergency contacts, and household family profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shadow-xs"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Profile
          </button>
        </div>
      </div>

      {/* Active Profile Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0">
              {currentPatient.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {currentPatient.full_name}
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900 capitalize">
                  {currentPatient.relationship || 'Self'}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Record ID: <span className="font-mono">{currentPatient.id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 transition"
          >
            Update Demographics
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Full Legal Name
            </span>
            <p className="font-medium text-zinc-900 dark:text-white">
              {currentPatient.full_name}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Relationship / Role
            </span>
            <p className="font-medium text-zinc-900 dark:text-white capitalize">
              {currentPatient.relationship || 'Self (Primary Account Owner)'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Date of Birth & Age
            </span>
            <p className="font-medium text-zinc-900 dark:text-white">
              {currentPatient.date_of_birth
                ? `${new Date(currentPatient.date_of_birth).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })} (${age !== null ? `${age} years` : ''})`
                : 'Not specified'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Biological Sex / Gender
            </span>
            <p className="font-medium text-zinc-900 dark:text-white capitalize">
              {currentPatient.gender || 'Not specified'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Blood Group
            </span>
            <p className="font-medium text-zinc-900 dark:text-white">
              {currentPatient.blood_type ? (
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 font-bold">
                  {currentPatient.blood_type}
                </span>
              ) : (
                'Not recorded'
              )}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Emergency Contact
            </span>
            <p className="font-medium text-zinc-900 dark:text-white">
              {currentPatient.emergency_contact || 'None specified'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Linked Account Email
            </span>
            <p className="font-medium text-zinc-900 dark:text-white">
              {userEmail || 'N/A'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Account Security ID
            </span>
            <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
              {userId}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Created Timestamp
            </span>
            <p className="font-medium text-zinc-900 dark:text-white">
              {currentPatient.created_at
                ? new Date(currentPatient.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Household Profiles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              All Household Profiles ({allProfiles.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Switch between family profiles to view their respective medical timelines and documents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add Profile
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProfiles.map((prof) => {
            const isSelected = prof.id === currentPatient.id
            const profAge = calculateAge(prof.date_of_birth)

            return (
              <div
                key={prof.id}
                className={`p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/20 dark:border-blue-700 dark:bg-blue-950/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                      {prof.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {prof.full_name}
                      </h4>
                      <p className="text-xs text-zinc-500 capitalize">
                        {prof.relationship || 'Self'} {profAge !== null ? `• ${profAge} yrs` : ''}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Active
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400">
                    Blood: <strong className="text-zinc-700 dark:text-zinc-300">{prof.blood_type || 'N/A'}</strong>
                  </span>

                  {isSelected ? (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Currently Selected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitch(prof.id)}
                      disabled={switchingId === prof.id}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 transition"
                    >
                      {switchingId === prof.id ? 'Switching...' : 'Switch to Profile'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fictional Demo Patient Helper */}
      <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
            Looking for quick evaluation data?
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Load the fictional demo patient (Ananya Sharma) populated with 6 diagnostic documents, lab tests, active prescriptions, and duplicate alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeedDemo}
          disabled={seedingDemo}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition shrink-0 shadow-xs"
        >
          {seedingDemo ? 'Loading Demo Data...' : 'Load Demo Patient (Ananya)'}
        </button>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        patient={currentPatient}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
