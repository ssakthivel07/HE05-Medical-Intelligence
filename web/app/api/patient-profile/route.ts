import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { ACTIVE_PATIENT_COOKIE } from '../../../lib/supabase/patientContext'

export async function GET() {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retrieve owned profiles
    const { data: ownedProfiles, error: ownedErr } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })

    if (ownedErr) {
      return NextResponse.json({ error: ownedErr.message }, { status: 500 })
    }

    // Retrieve shared profiles via family permissions
    const { data: sharedPerms } = await supabase
      .from('family_permissions')
      .select('patient_id, permission_level')
      .eq('user_id', user.id)

    let sharedProfiles: unknown[] = []
    if (sharedPerms && sharedPerms.length > 0) {
      const ids = sharedPerms.map((p) => p.patient_id)
      const { data: shared } = await supabase
        .from('patient_profiles')
        .select('*')
        .in('id', ids)
      if (shared) sharedProfiles = shared
    }

    const allProfiles = [...(ownedProfiles || []), ...sharedProfiles]

    return NextResponse.json({ ok: true, profiles: allProfiles })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error fetching profiles' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      full_name,
      date_of_birth,
      gender,
      set_as_active = true,
    } = body

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'Full legal name is required.' }, { status: 400 })
    }

    const { data: newProfile, error: insertErr } = await supabase
      .from('patient_profiles')
      .insert([
        {
          owner_user_id: user.id,
          full_name: full_name.trim(),
          date_of_birth: date_of_birth || null,
          gender: gender || null,
        },
      ])
      .select()
      .single()

    if (insertErr || !newProfile) {
      return NextResponse.json(
        { error: insertErr?.message || 'Could not create patient profile.' },
        { status: 400 }
      )
    }

    // If set_as_active, update cookie
    if (set_as_active) {
      const cookieStore = await cookies()
      cookieStore.set(ACTIVE_PATIENT_COOKIE, String(newProfile.id), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: newProfile.id,
          action: 'CREATE_PATIENT_PROFILE',
          resource_type: 'patient_profiles',
          resource_id: String(newProfile.id),
        },
      ])
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, profile: newProfile }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error processing profile request.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, full_name, date_of_birth, gender } = body

    if (!id) {
      return NextResponse.json({ error: 'Profile id is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found or not owned by user' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (full_name !== undefined) updates.full_name = full_name.trim()
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth || null
    if (gender !== undefined) updates.gender = gender || null

    const { data: updated, error: updateErr } = await supabase
      .from('patient_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, profile: updated })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update profile' },
      { status: 500 }
    )
  }
}
