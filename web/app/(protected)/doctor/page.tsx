import Link from 'next/link'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'
import type {
  MedicalDocument,
  MedicalEvent,
  Medication,
  Appointment,
} from '../../../lib/types'
import {
  analyzeDuplicateTests,
  analyzeMedicationInconsistencies,
} from '../../../lib/intelligence/clinicalChecks'
import DashboardLayoutClient from '../../../components/dashboard/DashboardLayoutClient'
import DoctorPortalClient from '../../../components/doctor/DoctorPortalClient'

export default async function DoctorPortalPage() {
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
            Please sign in with authorized clinical credentials to access the Doctor Portal.
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

  // Check authorized patients
  const { activePatient, allProfiles } = await getActivePatientProfile(supabase, user)

  let documents: MedicalDocument[] = []
  let events: MedicalEvent[] = []
  let medications: Medication[] = []
  let appointments: Appointment[] = []

  if (activePatient) {
    const [docsRes, eventsRes, medsRes, apptsRes] = await Promise.all([
      supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', activePatient.id)
        .order('document_date', { ascending: false }),
      supabase
        .from('medical_events')
        .select('*')
        .eq('patient_id', activePatient.id)
        .order('event_date', { ascending: false }),
      supabase
        .from('medications')
        .select('*')
        .eq('patient_id', activePatient.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', activePatient.id)
        .order('appointment_date', { ascending: true }),
    ])

    documents = (docsRes.data as MedicalDocument[]) || []
    events = (eventsRes.data as MedicalEvent[]) || []
    medications = (medsRes.data as Medication[]) || []
    appointments = (apptsRes.data as Appointment[]) || []
  }

  // Run clinical intelligence analyzers for duplicate tests and dosage conflicts
  const duplicateAlerts = analyzeDuplicateTests(events, documents)
  const inconsistencyAlerts = analyzeMedicationInconsistencies(medications, documents)

  // Record audit log for doctor view
  try {
    if (activePatient) {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: activePatient.id,
          action: 'DOCTOR_ACCESS',
          resource_type: 'patient_profiles',
          resource_id: String(activePatient.id),
        },
      ])
    }
  } catch {
    // Non-blocking
  }

  return (
    <DashboardLayoutClient
      patientName={activePatient?.full_name || 'Authorized Doctor'}
      userEmail={user.email ?? ''}
      allProfiles={allProfiles}
      activePatient={activePatient}
    >
      <DoctorPortalClient
        doctorName={user.email ? `Dr. ${user.email.split('@')[0]}` : 'Dr. Attending Physician'}
        patients={allProfiles}
        initialPatient={activePatient}
        initialDocuments={documents}
        initialEvents={events}
        initialMedications={medications}
        initialAppointments={appointments}
        initialDuplicateAlerts={duplicateAlerts}
        initialInconsistencies={inconsistencyAlerts}
      />
    </DashboardLayoutClient>
  )
}
