import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '../../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../../lib/supabase/patientContext'

export async function DELETE(
  _request: NextRequest,
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

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, doctor_name')
      .eq('id', id)
      .eq('patient_id', patient.id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      )
    }

    const { error: deleteErr } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      patient_id: patient.id,
      user_id: user.id,
      action: 'DELETE',
      resource_type: 'appointment',
      resource_id: id,
      details: { doctor_name: existing.doctor_name },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
