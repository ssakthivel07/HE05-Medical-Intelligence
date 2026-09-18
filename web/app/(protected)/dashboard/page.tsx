import Link from 'next/link'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'
import type {
  MedicalEvent,
  MedicalDocument,
  Appointment,
  Medication,
} from '../../../lib/types'
import {
  analyzeDuplicateTests,
  analyzeMedicationInconsistencies,
  generateTimelineInsights,
} from '../../../lib/intelligence/clinicalChecks'
import DashboardLayoutClient from '../../../components/dashboard/DashboardLayoutClient'
import SummaryCards from '../../../components/dashboard/SummaryCards'
import TimelinePreview from '../../../components/dashboard/TimelinePreview'
import RecentDocuments from '../../../components/dashboard/RecentDocuments'
import CurrentMedicationsWidget from '../../../components/dashboard/CurrentMedicationsWidget'
import UpcomingAppointments from '../../../components/dashboard/UpcomingAppointments'
import AIInsightsSection from '../../../components/dashboard/AIInsightsSection'
import QuickActionsBar from '../../../components/dashboard/QuickActionsBar'
import CreateProfileForm from '../../../components/patient/CreateProfileForm'

export default async function DashboardPage() {
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
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Authentication Required</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Please sign in to securely access your personal Medical Timeline.
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
  const { activePatient, allProfiles, isCaregiverAccess } = await getActivePatientProfile(
    supabase,
    user
  )

  // If user has no patient profile yet, display initial setup with 1-click Demo option
  if (!activePatient) {
    return (
      <DashboardLayoutClient patientName="New Patient" userEmail={user.email ?? ''}>
        <div className="max-w-2xl mx-auto py-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Initial Setup Required
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Welcome to Medical Timeline
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Consolidate your medical documents, treatment records, active prescriptions, and upcoming appointments into a secure, single-pane chronological timeline.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-blue-950 dark:text-blue-200">
                  Hackathon Quick Start / Demo Mode
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                  Pre-load fictional patient records (Ananya Sharma, 32) with lab tests, prescriptions, and timeline events in 1 click.
                </p>
              </div>
              <form action="/api/demo/seed" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shrink-0 transition"
                >
                  Explore Demo Patient →
                </button>
              </form>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-2">
                Or Create a Custom Profile
              </h3>
              <CreateProfileForm />
            </div>
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  // Retrieve records scoped strictly to activePatient.id
  let docsCount = 0
  let eventsCount = 0
  let medsCount = 0
  let apptCount = 0
  let allEvents: MedicalEvent[] = []
  let allDocs: MedicalDocument[] = []
  let allMeds: Medication[] = []
  let upcomingAppts: Appointment[] = []

  try {
    const nowIso = new Date().toISOString()
    const todayDateStr = nowIso.slice(0, 10)

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

    if (docsRes.data) {
      allDocs = docsRes.data as MedicalDocument[]
      docsCount = allDocs.length
    }
    if (eventsRes.data) {
      allEvents = eventsRes.data as MedicalEvent[]
      eventsCount = allEvents.length
    }
    if (medsRes.data) {
      allMeds = medsRes.data as Medication[]
      medsCount = allMeds.filter((m) => {
        if (m.is_active === false) return false
        const started = !m.start_date || m.start_date.slice(0, 10) <= todayDateStr
        const notEnded = !m.end_date || m.end_date.slice(0, 10) >= todayDateStr
        return started && notEnded
      }).length
    }
    if (apptsRes.data) {
      const appts = apptsRes.data as Appointment[]
      upcomingAppts = appts.filter((a) => a.appointment_date >= nowIso)
      apptCount = upcomingAppts.length
    }
  } catch (err) {
    console.error('Error fetching dashboard records:', err)
  }

  // Clinical Intelligence Analyses (Duplicate tests, dosage consistency, longitudinal insights)
  const duplicateAlerts = analyzeDuplicateTests(allEvents, allDocs)
  const inconsistencyAlerts = analyzeMedicationInconsistencies(allMeds, allDocs)
  const timelineInsights = generateTimelineInsights(allEvents, allMeds, allDocs)

  const isDemo = activePatient.full_name.toLowerCase().includes('demo')

  return (
    <DashboardLayoutClient
      patientName={activePatient.full_name}
      userEmail={user.email ?? ''}
      activePatient={activePatient}
      allProfiles={allProfiles}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Section 1 & 2: Welcome Header & Patient Context */}
        <section className="rounded-3xl border border-zinc-200 bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/50 p-6 dark:border-zinc-800 dark:from-blue-950/20 dark:via-zinc-900 dark:to-indigo-950/20 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Unified Medical History
                </span>
                {isCaregiverAccess && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                    Caregiver Access
                  </span>
                )}
                {isDemo && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    Demo Mode — Not a Real Patient
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Welcome back, {activePatient.full_name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Your complete medical history, organized in one timeline. Access clinical encounters, diagnostic lab reports, and active prescriptions with source evidence.
              </p>
            </div>

            {/* Patient Meta Badges */}
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 shadow-xs self-start md:self-auto">
              <span className="font-bold text-zinc-900 dark:text-white">Profile:</span>
              <span className="capitalize">{activePatient.relationship || 'Self'}</span>
              <span>•</span>
              <span className="capitalize">{activePatient.gender || 'Female'}</span>
              {activePatient.date_of_birth && (
                <>
                  <span>•</span>
                  <span>DOB: {activePatient.date_of_birth}</span>
                </>
              )}
              {activePatient.blood_type && (
                <>
                  <span>•</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {activePatient.blood_type}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Section 9: Quick Actions Bar */}
        <QuickActionsBar />

        {/* Section 3: Medical Summary Cards */}
        <SummaryCards
          docsCount={docsCount}
          eventsCount={eventsCount}
          medsCount={medsCount}
          apptCount={apptCount}
        />

        {/* Section 8: AI Insights Section (Duplicate detection, dosage checks, lab trends) */}
        <AIInsightsSection
          duplicateAlerts={duplicateAlerts}
          inconsistencies={inconsistencyAlerts}
          insights={timelineInsights}
        />

        {/* Sections 4, 5, 6, 7: Core Feeds Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 4: Timeline Preview */}
          <TimelinePreview events={allEvents} />

          {/* Section 5: Recent Documents */}
          <RecentDocuments docs={allDocs} />

          {/* Section 6: Current Medications */}
          <CurrentMedicationsWidget medications={allMeds} />

          {/* Section 7: Upcoming Appointments */}
          <UpcomingAppointments appts={upcomingAppts} />
        </section>

        {/* Section 10: Security, Privacy & Immutable PHI Audit Ledger Area */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  PHI Security & Immutable Audit Assurance
                </h3>
                <p className="text-xs text-zinc-500">
                  Patient ownership model, multi-tenant isolation, and encrypted cloud storage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Row Level Security Enforced
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <strong className="text-zinc-900 dark:text-zinc-100 block mb-1">
                Zero Public Storage
              </strong>
              Files are stored in private Supabase buckets. Access is mediated exclusively via short-lived signed URLs.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <strong className="text-zinc-900 dark:text-zinc-100 block mb-1">
                Strict Profile Scoping
              </strong>
              Queries enforce patient ID and user ownership constraints at the PostgreSQL database level.
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
              <strong className="text-zinc-900 dark:text-zinc-100 block mb-1">
                Audited Clinician Access
              </strong>
              Every chart review and document inspection through the Doctor Portal is recorded to the audit log.
            </div>
          </div>
        </section>
      </div>
    </DashboardLayoutClient>
  )
}
