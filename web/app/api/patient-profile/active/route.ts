import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerUser } from '../../../../lib/supabase/ssrClient'
import { ACTIVE_PATIENT_COOKIE } from '../../../../lib/supabase/patientContext'

export async function POST(req: Request) {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const patientId = body.patientId || body.patient_id
    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    // Verify ownership or shared permission
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('id, full_name, owner_user_id')
      .eq('id', patientId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    const isOwner = String(profile.owner_user_id) === String(user.id)

    if (!isOwner) {
      // Check family_permissions (columns: id, patient_id, user_id, permission_level, created_at)
      const { data: perm } = await supabase
        .from('family_permissions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!perm) {
        return NextResponse.json({ error: 'Access to this patient profile is not authorized' }, { status: 403 })
      }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_PATIENT_COOKIE, String(patientId), {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    // Log profile switch audit event
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: patientId,
          action: 'SWITCH_PROFILE',
          resource_type: 'patient_profiles',
          resource_id: String(patientId),
        },
      ])
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, activePatientId: patientId, patient: profile })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to switch profile' },
      { status: 500 }
    )
  }
}
