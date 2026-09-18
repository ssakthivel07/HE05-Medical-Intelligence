import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerUser } from '../../../../lib/supabase/ssrClient'
import { ACTIVE_PATIENT_COOKIE } from '../../../../lib/supabase/patientContext'

export async function POST() {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find demo profile
    const { data: profiles } = await supabase
      .from('patient_profiles')
      .select('id, full_name')
      .eq('owner_user_id', user.id)

    const demoProfile = profiles?.find((p) =>
      p.full_name.toLowerCase().includes('ananya sharma')
    )

    if (demoProfile) {
      // Clean up records associated with demo patient
      await supabase.from('medical_events').delete().eq('patient_id', demoProfile.id)
      await supabase.from('medications').delete().eq('patient_id', demoProfile.id)
      await supabase.from('appointments').delete().eq('patient_id', demoProfile.id)
      await supabase.from('medical_documents').delete().eq('patient_id', demoProfile.id)
      await supabase.from('patient_profiles').delete().eq('id', demoProfile.id)
    }

    // Reset cookie
    const cookieStore = await cookies()
    cookieStore.delete(ACTIVE_PATIENT_COOKIE)

    return NextResponse.json({ ok: true, message: 'Demo data removed successfully.' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reset demo data.' },
      { status: 500 }
    )
  }
}
