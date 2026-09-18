"use client"

import { useState } from 'react'
import Link from 'next/link'
import type {
  PatientProfile,
  MedicalDocument,
  MedicalEvent,
  Medication,
  Appointment,
  DuplicateTestAlert,
  InconsistencyAlert,
} from '../../lib/types'

interface DoctorPortalClientProps {
  doctorName: string
  patients: PatientProfile[]
  initialPatient: PatientProfile | null
  initialDocuments: MedicalDocument[]
  initialEvents: MedicalEvent[]
  initialMedications: Medication[]
  initialAppointments: Appointment[]
  initialDuplicateAlerts: DuplicateTestAlert[]
  initialInconsistencies: InconsistencyAlert[]
}

export default function DoctorPortalClient({
  doctorName,
  patients,
  initialPatient,
  initialDocuments,
  initialEvents,
  initialMedications,
  initialAppointments,
  initialDuplicateAlerts,
  initialInconsistencies,
}: DoctorPortalClientProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatient?.id ? String(initialPatient.id) : ''
  )
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'documents' | 'medications'>(
    'summary'
  )

  const activePatient = patients.find((p) => String(p.id) === String(selectedPatientId)) || initialPatient

  if (!activePatient) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          No Authorized Patients Available
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          You currently do not have clinical access permissions to any patient records. Patients must grant doctor access through their portal.
        </p>
      </div>
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const activeMeds = initialMedications.filter((m) => {
    if (m.is_active === false) return false
    return !m.end_date || m.end_date.slice(0, 10) >= todayStr
  })

  return (
    <div className="space-y-6">
      {/* Top Doctor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-white to-blue-50 dark:from-teal-950/30 dark:via-zinc-900 dark:to-blue-950/20 border border-teal-200 dark:border-teal-900/60 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Physician Clinical Portal — Authorized Session
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
            Clinical Review: {activePatient.full_name}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Authenticated as <strong>{doctorName}</strong>. All chart accesses are audited for HIPAA & PHI compliance.
          </p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="patient_select" className="text-xs font-bold text-zinc-500">
            Patient:
          </label>
          <select
            id="patient_select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="rounded-xl border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 dark:border-teal-800 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.relationship || 'Self'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Demographics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Age / DOB</span>
          <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
            {activePatient.date_of_birth ? activePatient.date_of_birth : 'N/A'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Biological Sex</span>
          <p className="text-sm font-bold text-zinc-900 dark:text-white capitalize mt-0.5">
            {activePatient.gender || 'Not specified'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Blood Group</span>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {activePatient.blood_type || 'B Positive (B+)'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Allergies</span>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5 truncate">
            {activePatient.allergies && activePatient.allergies.length > 0
              ? activePatient.allergies.join(', ')
              : 'NKDA (No Known Drug Allergies)'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Chronic Issues</span>
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
            {activePatient.chronic_conditions && activePatient.chronic_conditions.length > 0
              ? activePatient.chronic_conditions.join(', ')
              : 'None documented'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Chart ID</span>
          <p className="font-mono text-xs text-zinc-500 mt-0.5 truncate">
            {String(activePatient.id).slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Clinical Intelligence Alerts (Duplicate Tests & Dosage Inconsistencies) */}
      {(initialDuplicateAlerts.length > 0 || initialInconsistencies.length > 0) && (
        <div className="space-y-3">
          {initialDuplicateAlerts.map((dup, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Clinical Alert: Recent Laboratory Test
                  </span>
                  <span className="text-[11px] font-mono">({dup.daysApart} days prior)</span>
                </div>
                <h4 className="text-sm font-bold mt-0.5">{dup.testType}</h4>
                <p className="text-xs mt-1 leading-relaxed">{dup.message}</p>
              </div>
              {dup.previousDocumentId && (
                <Link
                  href={`/api/documents/${dup.previousDocumentId}/view`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-100 hover:bg-amber-100 shrink-0 self-center transition"
                >
                  View Prior Lab Report →
                </Link>
              )}
            </div>
          ))}

          {initialInconsistencies.map((inc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Potential Inconsistency Detected
                </span>
                <h4 className="text-sm font-bold mt-0.5">{inc.title}</h4>
                <p className="text-xs mt-1 leading-relaxed">{inc.description}</p>
                <p className="text-[11px] font-medium text-rose-800 dark:text-rose-300 mt-1.5 italic">
                  Suggested Action: {inc.suggestedAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'summary'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Medical History Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'timeline'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Full Clinical Timeline ({initialEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'documents'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Source Documents ({initialDocuments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('medications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'medications'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          Active Medications ({activeMeds.length})
        </button>
      </div>

      {/* Tab 1: Medical History Summary View */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Current Active Medications */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Active Medications ({activeMeds.length})
              </h3>
            </div>

            {activeMeds.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No active medications listed</p>
            ) : (
              <div className="space-y-3">
                {activeMeds.map((med) => (
                  <div
                    key={med.id}
                    className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
                      <span>{med.medicine_name}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {med.dosage || 'Prescribed'}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[11px]">{med.frequency || 'Daily schedule'}</p>
                    {med.instructions && (
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic pt-0.5">
                        Instructions: {med.instructions}
                      </p>
                    )}
                    {med.document_id && (
                      <div className="pt-1 text-[11px]">
                        <Link
                          href={`/api/documents/${med.document_id}/view`}
                          target="_blank"
                          className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          View Source Rx →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Recent Diagnoses & Clinical Encounters */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Recent Encounters & Diagnoses
              </h3>
            </div>

            {initialEvents.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No recorded encounters</p>
            ) : (
              <div className="space-y-3">
                {initialEvents.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        {ev.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-zinc-400">{ev.event_date}</span>
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                    {ev.document_id && (
                      <div className="pt-1 text-[11px]">
                        <Link
                          href={`/api/documents/${ev.document_id}/view`}
                          target="_blank"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          View Document →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Scheduled Follow-ups & Diagnostic Reports */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Consultations & Follow-ups
              </h3>
            </div>

            {initialAppointments.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No appointments scheduled</p>
            ) : (
              <div className="space-y-3">
                {initialAppointments.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {appt.doctor_name || 'Physician Consultation'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(appt.appointment_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">{appt.hospital_name}</p>
                    {appt.notes && (
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Full Clinical Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200 dark:border-teal-900 space-y-5">
            {initialEvents.map((ev) => (
              <div key={ev.id} className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full bg-white border-4 border-teal-600 dark:bg-zinc-900 shadow-sm" />
                <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                      {ev.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-zinc-500">{ev.event_date}</span>
                  </div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-white">{ev.title}</h4>
                  {ev.description && (
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                  {ev.document_id && (
                    <div className="pt-2">
                      <Link
                        href={`/api/documents/${ev.document_id}/view`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Source Document (Signed Temporary Link)
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Source Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          {initialDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                    {doc.file_name}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {doc.document_type}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {[doc.doctor_name, doc.hospital_name, doc.document_date].filter(Boolean).join(' • ')}
                </p>
                {doc.extraction_summary && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic">
                    AI Summary: {doc.extraction_summary}
                  </p>
                )}
              </div>

              <a
                href={`/api/documents/${doc.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shrink-0 transition"
              >
                Inspect Original File →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Active Medications */}
      {activeTab === 'medications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialMedications.map((med) => (
            <div
              key={med.id}
              className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-zinc-900 dark:text-white">{med.medicine_name}</h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {med.dosage || 'Prescribed'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">Frequency: {med.frequency || 'Daily'}</p>
              <p className="text-xs text-zinc-500">Duration: {med.duration || 'Ongoing'}</p>
              {med.instructions && (
                <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-xl">
                  {med.instructions}
                </p>
              )}
              {med.document_id && (
                <div className="pt-2 text-xs">
                  <Link
                    href={`/api/documents/${med.document_id}/view`}
                    target="_blank"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    View Source Prescription →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
