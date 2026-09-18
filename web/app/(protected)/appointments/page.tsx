import Link from 'next/link'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'
import type { Appointment } from '../../../lib/types'
import DashboardLayoutClient from '../../../components/dashboard/DashboardLayoutClient'
import CreateProfileForm from '../../../components/patient/CreateProfileForm'
import AppointmentsClient from '../../../components/appointments/AppointmentsClient'

export default async function AppointmentsPage() {
  let supabase = null
  let user = null

  try {
    const res = await getServerUser()
    supabase = res.supabase
    user = res.user
  } catch {
    supabase = null
    user = null
  }

  if (!supabase || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Authentication Required</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Please sign in to view your medical appointments.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Retrieve active patient profile (multi-profile aware)
  const { activePatient: patient, allProfiles } = await getActivePatientProfile(supabase, user)

  if (!patient) {
    return (
      <DashboardLayoutClient patientName="New Patient" userEmail={user.email ?? ''}>
        <div className="max-w-2xl mx-auto py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Patient Profile Required
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Please complete your initial profile before viewing appointments.
            </p>
            <CreateProfileForm />
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  let appointments: Appointment[] = []
  let dbError: string | null = null

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id,patient_id,doctor_name,hospital_name,appointment_date,notes,created_at')
      .eq('patient_id', patient.id)
      .order('appointment_date', { ascending: true })

    if (error) {
      dbError = 'Could not load appointments.'
    } else if (data) {
      appointments = data as Appointment[]
    }
  } catch {
    dbError = 'Error connecting to appointment database.'
  }

  return (
    <DashboardLayoutClient
      patientName={patient.full_name}
      userEmail={user.email ?? ''}
      activePatient={patient}
      allProfiles={allProfiles}
    >
      {dbError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          {dbError}
        </div>
      )}
      <AppointmentsClient
        initialAppointments={appointments}
        patientName={patient.full_name}
      />
    </DashboardLayoutClient>
  )
}
