import { NextResponse } from 'next/server'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'
import type { MedicalDocument, MedicalEvent, Medication, Appointment } from '../../../lib/types'

export async function POST(req: Request) {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, patientId } = await req.json()
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query text is required' }, { status: 400 })
    }

    const { activePatient } = await getActivePatientProfile(supabase, user, patientId)
    if (!activePatient) {
      return NextResponse.json({ error: 'No active patient profile found' }, { status: 404 })
    }

    // Retrieve active patient records for context
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

    const docs: MedicalDocument[] = (docsRes.data as MedicalDocument[]) || []
    const events: MedicalEvent[] = (eventsRes.data as MedicalEvent[]) || []
    const meds: Medication[] = (medsRes.data as Medication[]) || []
    const appts: Appointment[] = (apptsRes.data as Appointment[]) || []

    const q = query.toLowerCase().trim()

    let answer = ''
    const citations: { label: string; documentId?: string; date?: string }[] = []

    // 1. Medications Query
    if (
      q.includes('medicine') ||
      q.includes('medication') ||
      q.includes('prescription') ||
      q.includes('taking') ||
      q.includes('drug')
    ) {
      if (meds.length === 0) {
        answer = `There are no active or past medications currently recorded for ${activePatient.full_name}. You can upload a prescription document in the Documents tab to extract medications automatically.`
      } else {
        const today = new Date().toISOString().slice(0, 10)
        const activeMeds = meds.filter((m: Medication) => {
          return !m.end_date || m.end_date.slice(0, 10) >= today
        })

        if (activeMeds.length > 0) {
          answer = `Currently, ${activePatient.full_name} has ${activeMeds.length} active medication(s) on file:\n\n`
          activeMeds.forEach((m: Medication) => {
            answer += `• **${m.medicine_name}** — ${m.dosage || 'Prescribed dose'}, ${
              m.frequency || 'as instructed'
            } (Duration: ${m.duration || 'ongoing'})\n`
            if (m.document_id) {
              citations.push({
                label: `Prescription: ${m.medicine_name}`,
                documentId: m.document_id,
                date: m.start_date || undefined,
              })
            }
          })
          answer += `\n*Always adhere strictly to your prescribing physician's directions.*`
        } else {
          answer = `There are no ongoing active medications at this moment. You have ${meds.length} past or completed prescription(s) in your medical archive.`
        }
      }
    }
    // 2. Blood test / Lab test Query
    else if (
      q.includes('blood test') ||
      q.includes('lab') ||
      q.includes('test') ||
      q.includes('cbc') ||
      q.includes('lipid') ||
      q.includes('cholesterol')
    ) {
      const labEvents = events.filter(
        (e: MedicalEvent) =>
          e.event_type.toLowerCase().includes('lab') ||
          e.title.toLowerCase().includes('lab') ||
          e.title.toLowerCase().includes('blood') ||
          e.title.toLowerCase().includes('lipid')
      )

      if (labEvents.length === 0) {
        answer = `No laboratory or diagnostic blood test records are registered yet for ${activePatient.full_name}.`
      } else {
        const latest = labEvents[0]
        answer = `The most recent laboratory test on record is **${latest.title}** performed on **${
          latest.event_date
            ? new Date(latest.event_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : 'recent date'
        }**.\n\nFindings: ${latest.description || 'Details recorded in document.'}`

        if (latest.document_id) {
          citations.push({
            label: latest.title,
            documentId: latest.document_id,
            date: latest.event_date || undefined,
          })
        }
      }
    }
    // 3. Hospital Visit / Surgery Query
    else if (
      q.includes('hospital') ||
      q.includes('surgery') ||
      q.includes('admission') ||
      q.includes('visit') ||
      q.includes('discharge')
    ) {
      const hospitalEvents = events.filter(
        (e: MedicalEvent) =>
          e.event_type.toLowerCase().includes('hospital') ||
          e.event_type.toLowerCase().includes('surgery') ||
          e.title.toLowerCase().includes('hospital') ||
          e.title.toLowerCase().includes('discharge') ||
          e.title.toLowerCase().includes('surgery')
      )

      if (hospitalEvents.length === 0) {
        answer = `No hospital admissions or surgical encounters are found in ${activePatient.full_name}'s uploaded medical records.`
      } else {
        const latest = hospitalEvents[0]
        answer = `During the clinical encounter on **${
          latest.event_date
            ? new Date(latest.event_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : 'recorded date'
        }** (**${latest.title}**):\n\n${latest.description || 'Discharge report available.'}`

        if (latest.document_id) {
          citations.push({
            label: latest.title,
            documentId: latest.document_id,
            date: latest.event_date || undefined,
          })
        }
      }
    }
    // 4. Appointments Query
    else if (
      q.includes('appointment') ||
      q.includes('doctor') ||
      q.includes('schedule') ||
      q.includes('consultation') ||
      q.includes('when is')
    ) {
      const nowIso = new Date().toISOString()
      const upcoming = appts.filter((a: Appointment) => a.appointment_date >= nowIso)

      if (upcoming.length === 0) {
        answer = `There are no upcoming consultations or hospital visits currently scheduled for ${activePatient.full_name}. You can add new appointments from the Appointments tab.`
      } else {
        const nextAppt = upcoming[0]
        const d = new Date(nextAppt.appointment_date)
        answer = `Your next scheduled clinical appointment is with **${
          nextAppt.doctor_name || 'Physician'
        }** at **${nextAppt.hospital_name || 'Clinic'}** on **${d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}** at **${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}**.\n\n${
          nextAppt.notes ? `Note: ${nextAppt.notes}` : ''
        }`
      }
    }
    // 5. Recent Documents Query
    else if (
      q.includes('document') ||
      q.includes('file') ||
      q.includes('upload') ||
      q.includes('recent')
    ) {
      if (docs.length === 0) {
        answer = `No medical documents have been uploaded yet for ${activePatient.full_name}.`
      } else {
        answer = `${activePatient.full_name} has ${docs.length} stored medical document(s). The most recent uploads include:\n\n`
        docs.slice(0, 3).forEach((d: MedicalDocument) => {
          answer += `• **${d.file_name}** (${d.document_type || 'General'}) — ${d.created_at || 'Recent'}\n`
          citations.push({
            label: d.file_name,
            documentId: d.id,
            date: d.created_at || undefined,
          })
        })
      }
    }
    // 6. General / Fallback Query
    else {
      answer = `Based on ${activePatient.full_name}'s medical records on file:\n\n`
      answer += `• **Documents:** ${docs.length} total records on file.\n`
      answer += `• **Timeline Events:** ${events.length} chronological clinical events recorded.\n`
      answer += `• **Medications:** ${meds.length} recorded prescription(s).\n`
      answer += `• **Appointments:** ${appts.length} scheduled or completed visit(s).\n\n`
      answer += `You can ask specific questions like: "What medications am I taking?", "When was my last blood test?", or "What happened during my hospital visit?"`
    }

    return NextResponse.json({
      ok: true,
      answer,
      citations,
      patientName: activePatient.full_name,
      disclaimer:
        'AI Patient Assistant answers are derived strictly from your uploaded medical documents. This assistance is for informational organization only and does not constitute medical advice or clinical diagnosis.',
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Assistant query failed' },
      { status: 500 }
    )
  }
}
