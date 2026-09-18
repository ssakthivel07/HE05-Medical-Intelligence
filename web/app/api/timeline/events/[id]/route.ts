import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '../../../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../../../lib/supabase/patientContext'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, user } = await getServerUser()

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activePatient: patient } = await getActivePatientProfile(supabase, user)
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { is_verified } = body

    if (typeof is_verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_verified value; boolean required' },
        { status: 400 }
      )
    }

    // Verify event belongs to this patient
    const { data: existing, error: fetchErr } = await supabase
      .from('medical_events')
      .select('id, patient_id')
      .eq('id', id)
      .eq('patient_id', patient.id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Medical event not found or access denied' },
        { status: 404 }
      )
    }

    const { data: updated, error: updateErr } = await supabase
      .from('medical_events')
      .update({ is_verified })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      patient_id: patient.id,
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'medical_event',
      resource_id: id,
      details: { is_verified },
    })

    return NextResponse.json({ success: true, event: updated })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
