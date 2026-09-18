import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { PatientProfile } from '../types'

export const ACTIVE_PATIENT_COOKIE = 'active_patient_id'

export interface PatientContextResult {
  activePatient: PatientProfile | null
  allProfiles: PatientProfile[]
  isCaregiverAccess: boolean
  error?: string | null
}

/**
 * Resolves the active patient profile for the authenticated user session.
 * Checks cookie `active_patient_id` or query parameter, ensuring strict
 * authorization: user must own the profile OR have an active caregiver grant.
 */
export async function getActivePatientProfile(
  supabase: SupabaseClient,
  user: User,
  preferredPatientId?: string | null
): Promise<PatientContextResult> {
  try {
    if (!user?.id) {
      return {
        activePatient: null,
        allProfiles: [],
        isCaregiverAccess: false,
      }
    }

    // 1. Retrieve all profiles owned by this user
    // Actual table columns: id, owner_user_id, full_name, date_of_birth, gender, created_at, updated_at
    const { data: ownedProfiles, error: ownedErr } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })

    if (ownedErr) {
      console.error('Error fetching owned patient profiles:', {
        message: ownedErr.message,
        code: ownedErr.code,
        details: ownedErr.details,
        hint: ownedErr.hint,
      })
    }

    // 2. Retrieve any profiles shared via family_permissions
    // Actual table columns: id, patient_id, user_id, permission_level, created_at
    const { data: sharedPermissions, error: sharedErr } = await supabase
      .from('family_permissions')
      .select('patient_id, permission_level')
      .eq('user_id', user.id)

    if (sharedErr) {
      console.error('Error fetching shared permissions:', {
        message: sharedErr.message,
        code: sharedErr.code,
        details: sharedErr.details,
        hint: sharedErr.hint,
      })
    }

    let sharedProfiles: PatientProfile[] = []
    if (sharedPermissions && sharedPermissions.length > 0) {
      const sharedPatientIds = sharedPermissions.map((p) => p.patient_id)
      const { data: sharedData, error: sharedDataErr } = await supabase
        .from('patient_profiles')
        .select('*')
        .in('id', sharedPatientIds)

      if (sharedDataErr) {
        console.error('Error fetching shared profiles:', {
          message: sharedDataErr.message,
          code: sharedDataErr.code,
          details: sharedDataErr.details,
          hint: sharedDataErr.hint,
        })
      } else if (sharedData) {
        sharedProfiles = sharedData as PatientProfile[]
      }
    }

    const allProfiles: PatientProfile[] = [
      ...((ownedProfiles as PatientProfile[]) || []),
      ...sharedProfiles,
    ]

    if (allProfiles.length === 0) {
      return {
        activePatient: null,
        allProfiles: [],
        isCaregiverAccess: false,
      }
    }

    // 3. Determine target patient ID: preference param > cookie > first available authorized profile
    let cookiePatientId: string | undefined
    try {
      const cookieStore = await cookies()
      cookiePatientId = cookieStore.get(ACTIVE_PATIENT_COOKIE)?.value
    } catch {
      // In certain non-request rendering contexts, cookies() is not available
    }

    const targetId = preferredPatientId || cookiePatientId

    // Only pick from authorized profiles
    let active = targetId ? allProfiles.find((p) => String(p.id) === String(targetId)) : null

    if (!active) {
      active = allProfiles[0]
    }

    const isCaregiver = String(active.owner_user_id) !== String(user.id)

    return {
      activePatient: active,
      allProfiles,
      isCaregiverAccess: isCaregiver,
    }
  } catch (err) {
    console.error('Failed to resolve active patient profile:', err instanceof Error ? err.message : err)
    return {
      activePatient: null,
      allProfiles: [],
      isCaregiverAccess: false,
      error: 'Unable to resolve patient session.',
    }
  }
}
