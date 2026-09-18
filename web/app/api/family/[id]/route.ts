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

    // Verify permission belongs to this patient
    const { data: existing, error: fetchErr } = await supabase
      .from('family_permissions')
      .select('id, user_id, permission_level')
      .eq('id', id)
      .eq('patient_id', patient.id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Permission not found or access denied' },
        { status: 404 }
      )
    }

    const { error: deleteErr } = await supabase
      .from('family_permissions')
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
      resource_type: 'family_permission',
      resource_id: id,
      details: { revoked_user_id: existing.user_id, permission_level: existing.permission_level },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
