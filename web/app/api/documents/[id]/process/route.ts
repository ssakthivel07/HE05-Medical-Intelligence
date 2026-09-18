import { NextResponse } from 'next/server'
import { getServerUser } from '../../../../../lib/supabase/ssrClient'
import { STORAGE_BUCKET } from '../../../../../lib/supabase/storage'
import { extractMedicalDocument } from '../../../../../lib/extraction/extractor'
import { getActivePatientProfile } from '../../../../../lib/supabase/patientContext'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params
  const { supabase, user } = await getServerUser()

  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
  }

  // 1. Fetch document to determine patient_id
  const { data: doc, error: docError } = await supabase
    .from('medical_documents')
    .select('*')
    .eq('id', documentId)
    .limit(1)
    .maybeSingle()

  if (docError || !doc) {
    return NextResponse.json(
      { error: 'Document not found or you do not have permission to process it.' },
      { status: 404 }
    )
  }

  // 2. Verify authorization for doc.patient_id
  const { activePatient } = await getActivePatientProfile(supabase, user, doc.patient_id)
  if (!activePatient || String(activePatient.id) !== String(doc.patient_id)) {
    return NextResponse.json(
      { error: 'You are not authorized to process documents for this patient record.' },
      { status: 403 }
    )
  }

  try {
    // 3. Mark document as "processing"
    await supabase
      .from('medical_documents')
      .update({ processing_status: 'processing' })
      .eq('id', doc.id)

    // 4. Generate short-lived signed URL for server-side extraction (expires in 60s)
    let signedUrl: string | null = null
    if (doc.storage_path) {
      const { data: signedData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(doc.storage_path, 60)
      signedUrl = signedData?.signedUrl || null
    }

    // 5. Execute extraction abstraction
    const extracted = await extractMedicalDocument({
      document: doc,
      signedUrl,
    })

    // 6. Prevent duplicates on re-processing: clean previously extracted items for this document
    await supabase.from('event_evidence').delete().eq('document_id', doc.id)
    await supabase.from('medical_events').delete().eq('document_id', doc.id)
    await supabase.from('medications').delete().eq('document_id', doc.id)

    // 7. Persist extracted medical events with confidence & page-level evidence
    if (extracted.events && extracted.events.length > 0) {
      const eventsPayload = extracted.events.map((ev) => {
        const evidenceNote = ev.evidence?.text_snippet
          ? `\n\n[Evidence - ${ev.evidence.page_number ? `Page ${ev.evidence.page_number}` : 'Source Citation'}]: "${ev.evidence.text_snippet}"`
          : ''

        return {
          patient_id: activePatient.id,
          document_id: doc.id,
          event_type: ev.event_type,
          event_date: ev.event_date || doc.document_date || new Date().toISOString().slice(0, 10),
          title: ev.title,
          description: `${ev.description}${evidenceNote}`,
          confidence: ev.confidence,
          is_verified: false,
        }
      })

      const { data: insertedEvents, error: eventsInsertError } = await supabase
        .from('medical_events')
        .insert(eventsPayload)
        .select('id, title')

      if (eventsInsertError) {
        console.error('Error inserting extracted medical events:', {
          message: eventsInsertError.message,
          code: eventsInsertError.code,
        })
      } else if (insertedEvents && insertedEvents.length > 0) {
        // Record trace in event_evidence table
        const evidencePayload = insertedEvents.map((insertedEv, idx) => {
          const sourceEv = extracted.events[idx]
          return {
            event_id: insertedEv.id,
            document_id: doc.id,
            page_number: sourceEv?.evidence?.page_number || 1,
            evidence_text: sourceEv?.evidence?.text_snippet || sourceEv?.description || '',
          }
        })

        const { error: evErr } = await supabase.from('event_evidence').insert(evidencePayload)
        if (evErr) {
          console.error('Error recording event evidence:', {
            message: evErr.message,
            code: evErr.code,
          })
        }
      }
    }

    // 8. Persist extracted medications
    if (extracted.medications && extracted.medications.length > 0) {
      const medsPayload = extracted.medications.map((med) => ({
        patient_id: activePatient.id,
        document_id: doc.id,
        medicine_name: med.medicine_name,
        dosage: med.dosage || null,
        frequency: med.frequency || null,
        duration: med.duration || null,
        start_date: med.start_date || doc.document_date || null,
        end_date: med.end_date || null,
      }))

      const { error: medsInsertError } = await supabase
        .from('medications')
        .insert(medsPayload)

      if (medsInsertError) {
        console.error('Error inserting extracted medications:', {
          message: medsInsertError.message,
          code: medsInsertError.code,
        })
      }
    }

    // 9. Update document status to "processed" and backfill missing metadata if detected
    const docUpdates: Record<string, unknown> = {
      processing_status: 'processed',
    }
    if (!doc.hospital_name && extracted.hospital_name) {
      docUpdates.hospital_name = extracted.hospital_name
    }
    if (!doc.doctor_name && extracted.doctor_name) {
      docUpdates.doctor_name = extracted.doctor_name
    }
    if (!doc.document_date && extracted.document_date) {
      docUpdates.document_date = extracted.document_date
    }

    await supabase
      .from('medical_documents')
      .update(docUpdates)
      .eq('id', doc.id)

    // 10. Record secure audit log
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: activePatient.id,
          action: 'PROCESS_DOCUMENT_AI',
          resource_type: 'medical_documents',
          resource_id: String(doc.id),
        },
      ])
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      ok: true,
      message: 'Document intelligence extraction completed successfully.',
      data: extracted,
    })
  } catch (err) {
    console.error('Document processing failed:', err)

    await supabase
      .from('medical_documents')
      .update({ processing_status: 'processing_failed' })
      .eq('id', doc.id)

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to process document intelligence. Please try again.',
      },
      { status: 422 }
    )
  }
}
