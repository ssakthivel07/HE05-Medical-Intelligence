import Link from 'next/link'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'
import type { MedicalDocument } from '../../../lib/types'
import DashboardLayoutClient from '../../../components/dashboard/DashboardLayoutClient'
import DocumentsClient from '../../../components/documents/DocumentsClient'
import CreateProfileForm from '../../../components/patient/CreateProfileForm'

export default async function DocumentsPage() {
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
            Please sign in to securely access your medical documents.
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

  // Resolve active patient profile and all profiles for this user
  const { activePatient, allProfiles } = await getActivePatientProfile(supabase, user)

  if (!activePatient) {
    return (
      <DashboardLayoutClient patientName="New Patient" userEmail={user.email ?? ''}>
        <div className="max-w-2xl mx-auto py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Patient Profile Required
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Please complete your patient profile before uploading medical documents.
            </p>
            <CreateProfileForm />
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  // Fetch patient documents strictly filtered by active patient_id
  let documents: MedicalDocument[] = []
  let dbError: string | null = null

  try {
    const { data: docsData, error: docsError } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', activePatient.id)
      .order('document_date', { ascending: false })

    if (docsError) {
      dbError = 'Could not load your documents. Please try again.'
    } else if (docsData) {
      documents = docsData as MedicalDocument[]
    }
  } catch {
    dbError = 'Error connecting to document storage database.'
  }

  return (
    <DashboardLayoutClient
      patientName={activePatient.full_name}
      userEmail={user.email ?? ''}
      activePatient={activePatient}
      allProfiles={allProfiles}
    >
      <div className="space-y-6">
        {dbError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {dbError}
          </div>
        )}

        <DocumentsClient documents={documents} activePatientId={String(activePatient.id)} />
      </div>
    </DashboardLayoutClient>
  )
}
