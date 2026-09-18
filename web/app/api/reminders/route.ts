import { NextResponse } from 'next/server'
import { getServerUser } from '../../../lib/supabase/ssrClient'
import { getActivePatientProfile } from '../../../lib/supabase/patientContext'
import type { Reminder, Medication, Appointment } from '../../../lib/types'

export async function GET(req: Request) {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    const { activePatient } = await getActivePatientProfile(supabase, user, patientId)
    if (!activePatient) {
      return NextResponse.json({ error: 'No active patient profile' }, { status: 404 })
    }

    // 1. Fetch user-configured reminders
    const { data: storedReminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('patient_id', activePatient.id)
      .order('scheduled_time', { ascending: true })

    // 2. Synthesize dynamic reminders from active medications & upcoming appointments
    const nowIso = new Date().toISOString()
    const todayStr = nowIso.slice(0, 10)

    const [medsRes, apptsRes] = await Promise.all([
      supabase
        .from('medications')
        .select('*')
        .eq('patient_id', activePatient.id),
      supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', activePatient.id)
        .gte('appointment_date', nowIso)
        .order('appointment_date', { ascending: true })
        .limit(5),
    ])

    const dynamicReminders: Reminder[] = []

    // Add upcoming appointments
    if (apptsRes.data) {
      (apptsRes.data as Appointment[]).forEach((a: Appointment) => {
        dynamicReminders.push({
          id: `appt-${a.id}`,
          patient_id: activePatient.id,
          user_id: user.id,
          title: `Appointment with ${a.doctor_name || 'Physician'} at ${a.hospital_name || 'Clinic'}`,
          category: 'appointment',
          scheduled_time: a.appointment_date,
          is_completed: false,
          created_at: a.created_at,
        })
      })
    }

    // Add active medication schedule for today
    if (medsRes.data) {
      const activeMeds = (medsRes.data as Medication[]).filter((m: Medication) => {
        const started = !m.start_date || m.start_date.slice(0, 10) <= todayStr
        const notEnded = !m.end_date || m.end_date.slice(0, 10) >= todayStr
        return started && notEnded
      })

      activeMeds.forEach((m: Medication) => {
        dynamicReminders.push({
          id: `med-${m.id}`,
          patient_id: activePatient.id,
          user_id: user.id,
          title: `Take ${m.medicine_name} (${m.dosage || 'prescribed dose'}) - ${m.frequency || 'Daily'}`,
          category: 'medication',
          scheduled_time: `${todayStr}T20:00:00Z`,
          is_completed: false,
          created_at: m.created_at,
        })
      })
    }

    const allReminders: Reminder[] = [
      ...((storedReminders as Reminder[]) || []),
      ...dynamicReminders,
    ]

    return NextResponse.json({ ok: true, reminders: allReminders })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch reminders' },
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
    const { patient_id, title, category = 'general', scheduled_time } = body

    if (!patient_id || !title || !scheduled_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert([
        {
          patient_id,
          user_id: user.id,
          title: title.trim(),
          category,
          scheduled_time,
          is_completed: false,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, reminder: data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create reminder' },
      { status: 500 }
    )
  }
}
