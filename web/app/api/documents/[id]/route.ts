import { NextResponse } from 'next/server'
import { getServerUser } from '../../../../lib/supabase/ssrClient'
import { STORAGE_BUCKET } from '../../../../lib/supabase/storage'
import { getActivePatientProfile } from '../../../../lib/supabase/patientContext'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activePatient } = await getActivePatientProfile(supabase, user)
    if (!activePatient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    // Retrieve document to verify ownership and get storage_path
    const { data: doc, error: docError } = await supabase
      .from('medical_documents')
      .select('id, storage_path, file_name, patient_id')
      .eq('id', documentId)
      .eq('patient_id', activePatient.id)
      .maybeSingle()

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document not found or you do not have permission to delete it.' },
        { status: 404 }
      )
    }

    // 1. Delete associated extracted evidence, events and medications
    await supabase.from('event_evidence').delete().eq('document_id', doc.id)
    await supabase.from('medical_events').delete().eq('document_id', doc.id)
    await supabase.from('medications').delete().eq('document_id', doc.id)

    // 2. Delete storage file if exists
    if (doc.storage_path) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path])
      } catch (err) {
        console.error('Error removing storage file during document delete:', err)
      }
    }

    // 3. Delete document row
    const { error: deleteErr } = await supabase
      .from('medical_documents')
      .delete()
      .eq('id', doc.id)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    // 4. Record audit log
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: activePatient.id,
          action: 'DELETE_DOCUMENT',
          resource_type: 'medical_documents',
          resource_id: String(doc.id),
        },
      ])
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, message: 'Document deleted successfully.' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error deleting document' },
      { status: 500 }
    )
  }
}
