import { NextResponse } from 'next/server'
import { getServerUser } from '../../../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../../../lib/supabase/patientContext'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const { supabase, user } = await getServerUser()

    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    // 1. Fetch document
    const { data: doc, error: docError } = await supabase
      .from('medical_documents')
      .select('id, file_name, document_type, document_date, hospital_name, doctor_name, processing_status, created_at, patient_id')
      .eq('id', documentId)
      .limit(1)
      .maybeSingle()

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document not found or access denied.' },
        { status: 404 }
      )
    }

    // 2. Verify authorization for doc.patient_id
    const { activePatient } = await getActivePatientProfile(supabase, user, doc.patient_id)
    if (!activePatient || String(activePatient.id) !== String(doc.patient_id)) {
      return NextResponse.json(
        { error: 'You are not authorized to inspect insights for this document.' },
        { status: 403 }
      )
    }

    // 3. Fetch associated extracted medical events
    const { data: events } = await supabase
      .from('medical_events')
      .select('*')
      .eq('document_id', doc.id)
      .order('event_date', { ascending: false })

    // 4. Fetch associated extracted medications
    const { data: medications } = await supabase
      .from('medications')
      .select('*')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: false })

    // 5. Fetch associated event evidence citations
    const { data: evidence } = await supabase
      .from('event_evidence')
      .select('*')
      .eq('document_id', doc.id)
      .order('page_number', { ascending: true })

    // 6. Synthesize clinically relevant "Questions to Ask Your Doctor" based on doc type and contents
    const docTypeLower = (doc.document_type || '').toLowerCase()
    const questions: string[] = []

    if (docTypeLower.includes('lab') || docTypeLower.includes('blood') || docTypeLower.includes('test')) {
      questions.push('Are any values on this report trending up or down compared to my previous test?')
      questions.push('Do any of these results require changes to my daily diet or exercise habits?')
      questions.push('When would you recommend re-testing this panel to monitor progress?')
    } else if (docTypeLower.includes('prescription') || docTypeLower.includes('rx')) {
      questions.push('What are the potential side effects of this medication, and what should I do if they occur?')
      questions.push('Can this medication be taken with my existing supplements and other prescriptions?')
      questions.push('Should I complete the entire course even if my symptoms improve before finishing?')
    } else if (docTypeLower.includes('discharge') || docTypeLower.includes('summary')) {
      questions.push('What warning signs or symptoms should prompt immediate emergency evaluation?')
      questions.push('When is my scheduled outpatient follow-up consultation?')
      questions.push('What activity or dietary restrictions should I observe during the recovery period?')
    } else {
      questions.push('What are the main clinical takeaways from this examination?')
      questions.push('Are any preventive follow-up tests or lifestyle adjustments advised?')
    }

    // 7. Important dates extracted
    const importantDates: { label: string; date: string }[] = []
    if (doc.document_date) {
      importantDates.push({ label: 'Document Encounter Date', date: doc.document_date })
    }
    if (events && events.length > 0) {
      events.forEach((e) => {
        if (e.event_date && e.event_date !== doc.document_date) {
          importantDates.push({ label: e.title, date: e.event_date })
        }
      })
    }

    const summary =
      events && events.length > 0
        ? `Automated medical intelligence processed ${events.length} event(s) and ${
            medications?.length || 0
          } prescription record(s).`
        : `Medical document processed. No significant acute findings or medications detected.`

    return NextResponse.json({
      ok: true,
      document: doc,
      events: events || [],
      medications: medications || [],
      evidence: evidence || [],
      summary,
      questions,
      importantDates,
      disclaimer:
        'AI insights reflect automated natural language parsing of this document. They do not constitute an independent medical diagnosis. Please consult your physician.',
    })
  } catch (err) {
    console.error('Failed to retrieve document insights:', err)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
