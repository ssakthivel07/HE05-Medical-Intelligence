import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'

export async function GET() {
  try {
    const { supabase, user } = await getServerUser()
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activePatient: patient } = await getActivePatientProfile(supabase, user)
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('family_permissions')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ permissions: data })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getServerUser()
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activePatient: patient } = await getActivePatientProfile(supabase, user)
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    // Only owner can grant permissions
    if (patient.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the patient profile owner can grant caregiver permissions.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { user_id, permission_level } = body

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'Delegate user ID or identifier is required.' },
        { status: 400 }
      )
    }

    const validLevels = ['view', 'edit', 'full']
    const level = validLevels.includes(permission_level) ? permission_level : 'view'

    // Check if permission already exists
    const { data: existing } = await supabase
      .from('family_permissions')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('user_id', user_id.trim())
      .maybeSingle()

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('family_permissions')
        .update({ permission_level: level })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      await supabase.from('audit_logs').insert({
        patient_id: patient.id,
        user_id: user.id,
        action: 'UPDATE',
        resource_type: 'family_permission',
        resource_id: existing.id,
        details: { delegate_user_id: user_id, permission_level: level },
      })

      return NextResponse.json({ success: true, permission: updated })
    }

    const { data: newPerm, error: insertErr } = await supabase
      .from('family_permissions')
      .insert({
        patient_id: patient.id,
        user_id: user_id.trim(),
        permission_level: level,
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      patient_id: patient.id,
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'family_permission',
      resource_id: newPerm.id,
      details: { delegate_user_id: user_id, permission_level: level },
    })

    return NextResponse.json({ success: true, permission: newPerm }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
