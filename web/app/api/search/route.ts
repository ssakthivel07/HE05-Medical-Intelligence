import { NextResponse } from 'next/server'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'

export async function GET(req: Request) {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || '').trim()
    const patientId = searchParams.get('patientId')

    const { activePatient } = await getActivePatientProfile(supabase, user, patientId)
    if (!activePatient) {
      return NextResponse.json({ error: 'No active patient profile' }, { status: 404 })
    }

    if (!query) {
      return NextResponse.json({
        documents: [],
        events: [],
        medications: [],
        appointments: [],
      })
    }

    const ilikeQuery = `%${query}%`

    // Run parallel searches scoped strictly to activePatient.id
    const [docsRes, eventsRes, medsRes, apptsRes] = await Promise.all([
      // 1. Documents search
      supabase
        .from('medical_documents')
        .select('id, file_name, document_type, document_date, hospital_name, doctor_name')
        .eq('patient_id', activePatient.id)
        .or(
          `file_name.ilike.${ilikeQuery},document_type.ilike.${ilikeQuery},hospital_name.ilike.${ilikeQuery},doctor_name.ilike.${ilikeQuery}`
        )
        .limit(6),

      // 2. Timeline events search
      supabase
        .from('medical_events')
        .select('id, title, event_type, event_date, description, document_id')
        .eq('patient_id', activePatient.id)
        .or(`title.ilike.${ilikeQuery},description.ilike.${ilikeQuery},event_type.ilike.${ilikeQuery}`)
        .limit(6),

      // 3. Medications search
      supabase
        .from('medications')
        .select('id, medicine_name, dosage, frequency, start_date, end_date, document_id')
        .eq('patient_id', activePatient.id)
        .or(`medicine_name.ilike.${ilikeQuery},dosage.ilike.${ilikeQuery}`)
        .limit(6),

      // 4. Appointments search
      supabase
        .from('appointments')
        .select('id, doctor_name, hospital_name, specialty, appointment_date, notes')
        .eq('patient_id', activePatient.id)
        .or(
          `doctor_name.ilike.${ilikeQuery},hospital_name.ilike.${ilikeQuery},notes.ilike.${ilikeQuery}`
        )
        .limit(6),
    ])

    return NextResponse.json({
      documents: docsRes.data || [],
      events: eventsRes.data || [],
      medications: medsRes.data || [],
      appointments: apptsRes.data || [],
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search error' },
      { status: 500 }
    )
  }
}
