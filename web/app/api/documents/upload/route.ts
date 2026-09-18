import { NextResponse } from 'next/server'
import { getServerUser } from '../../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../../lib/supabase/patientContext'
import {
  STORAGE_BUCKET,
  validateDocumentFile,
  generateStoragePath,
  normalizeDocumentType,
} from '../../../../lib/supabase/storage'

export async function POST(req: Request) {
  try {
    console.log('[document-upload] request_received')

    const { supabase, user } = await getServerUser()
    console.log('[document-upload] auth_checked')

    if (!supabase || !user) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // Parse multipart form data (call once)
    const formData = await req.formData()
    console.log('[document-upload] file_validated')

    const fileRaw = formData.get('file')
    if (!(fileRaw instanceof File)) {
      return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
    }
    const file = fileRaw as File

    const requestedPatientId = (formData.get('patient_id') as string)?.trim() || null
    const documentType = (formData.get('document_type') as string)?.trim() || 'General Record'
    const documentDate =
      (formData.get('document_date') as string)?.trim() || new Date().toISOString().slice(0, 10)
    const hospitalName = (formData.get('hospital_name') as string)?.trim() || null
    const doctorName = (formData.get('doctor_name') as string)?.trim() || null

    console.log('[document-upload] patient_resolved')
    // Retrieve and verify active patient profile
    const { activePatient } = await getActivePatientProfile(supabase, user, requestedPatientId)

    if (!activePatient) {
      return NextResponse.json(
        { error: 'PATIENT_REQUIRED', message: 'No authorized patient profile found. Create/select a profile before uploading.' },
        { status: 400 }
      )
    }

    const patientId = activePatient.id

    // Validate file type and size
    console.log('[document-upload] file_validated')
    const validationError = validateDocumentFile({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (validationError) {
      return NextResponse.json({ error: 'UNSUPPORTED_FILE_TYPE', message: validationError }, { status: 400 })
    }

    // Normalize and sanitize document classification
    const cleanDocumentType = normalizeDocumentType(documentType, file.name)

    // Generate secure, user- and patient-scoped storage path
    const { safeFileName, storagePath } = generateStoragePath(user.id, patientId, file.name)

    // Convert file to Uint8Array for Supabase storage upload
    console.log('[document-upload] storage_upload_started')
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // 1. Upload to Supabase Storage in private bucket
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Document upload server error', {
        name: uploadError instanceof Error ? uploadError.name : undefined,
        message: uploadError instanceof Error ? uploadError.message : String(uploadError),
      })

      console.log('[document-upload] storage_upload_failed')
      return NextResponse.json(
        {
          error: 'STORAGE_UPLOAD_FAILED',
          message:
            uploadError.message ||
            'Failed to store document in secure storage. Verify the private bucket exists and storage policies are active.',
        },
        { status: 500 }
      )
    }

    console.log('[document-upload] storage_upload_completed')

    // 2. Insert record into medical_documents table
    console.log('[document-upload] metadata_insert_started')
    const { data: documentRow, error: insertError } = await supabase
      .from('medical_documents')
      .insert([
        {
          patient_id: patientId,
          uploaded_by: user.id,
          file_name: safeFileName,
          storage_path: storagePath,
          document_type: cleanDocumentType,
          document_date: documentDate,
          hospital_name: hospitalName,
          doctor_name: doctorName,
          processing_status: 'uploaded',
        },
      ])
      .select()
      .single()

    if (insertError || !documentRow) {
      console.error('Document upload server error', {
        name: insertError?.name,
        message: insertError?.message,
        code: insertError?.code,
        details: insertError?.details,
        hint: insertError?.hint,
      })

      console.log('[document-upload] metadata_insert_failed')
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
      } catch (cleanupErr) {
        console.error('Failed to remove orphaned storage object during rollback:', {
          message: cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr),
        })
      }

      return NextResponse.json({ error: 'DOCUMENT_METADATA_INSERT_FAILED' }, { status: 500 })
    }

    console.log('[document-upload] metadata_insert_completed')

    // 4. Record audit log (non-blocking)
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: patientId,
          action: 'UPLOAD_DOCUMENT',
          resource_type: 'medical_documents',
          resource_id: String(documentRow.id),
        },
      ])
    } catch (auditErr) {
      console.error('Audit log write failed:', {
        message: auditErr instanceof Error ? auditErr.message : String(auditErr),
      })
    }

    console.log('[document-upload] upload_finished')

    return NextResponse.json(
      {
        ok: true,
        document: documentRow,
      },
      { status: 201 }
    )
  } catch (err) {
    // Structured safe logging for development troubleshooting
    console.error('Document upload server error', {
      name: err instanceof Error ? err.name : undefined,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })

    // If this is a Supabase/Postgres error-like object, log its public fields safely
    const supaErr = (err as any)
    if (supaErr && (supaErr.code || supaErr.message)) {
      console.error('Document upload supabase error details', {
        message: supaErr.message,
        code: supaErr.code,
        details: supaErr.details,
        hint: supaErr.hint,
        status: supaErr.status,
      })
    }

    return NextResponse.json(
      { error: 'INTERNAL_UPLOAD_ERROR' },
      { status: 500 }
    )
  }
}
