import { NextResponse } from 'next/server'
import { getServerUser } from '../../../../../lib/supabase/ssrClient'
import { STORAGE_BUCKET } from '../../../../../lib/supabase/storage'
import { getActivePatientProfile } from '../../../../../lib/supabase/patientContext'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const { supabase, user } = await getServerUser()

    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch document
    const { data: doc, error: docError } = await supabase
      .from('medical_documents')
      .select('id, storage_path, file_name, document_type, patient_id')
      .eq('id', documentId)
      .limit(1)
      .maybeSingle()

    if (docError || !doc || !doc.storage_path) {
      return NextResponse.json(
        { error: 'Document not found or you do not have permission to view it.' },
        { status: 404 }
      )
    }

    // 2. Verify authorization for doc.patient_id
    const { activePatient } = await getActivePatientProfile(supabase, user, doc.patient_id)
    if (!activePatient || String(activePatient.id) !== String(doc.patient_id)) {
      return NextResponse.json(
        { error: 'Access denied: You are not authorized to view this patient document.' },
        { status: 403 }
      )
    }

    // 3. Generate short-lived signed URL (valid for 120 seconds)
    const { data: signedData, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.storage_path, 120)

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate temporary access link for document.' },
        { status: 500 }
      )
    }

    // 4. Record audit log
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: doc.patient_id,
          action: 'VIEW_DOCUMENT',
          resource_type: 'medical_documents',
          resource_id: String(doc.id),
        },
      ])
    } catch {
      // Non-blocking
    }

    // Check if client expects JSON
    const acceptHeader = req.headers.get('accept') || ''
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({ ok: true, signedUrl: signedData.signedUrl })
    }

    // Otherwise redirect browser to secure temporary signed URL
    return NextResponse.redirect(signedData.signedUrl)
  } catch {
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
