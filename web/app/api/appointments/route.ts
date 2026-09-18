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
      .from('appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('appointment_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments: data })
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

    const body = await request.json()
    const { doctor_name, hospital_name, appointment_date, notes } = body

    if (!appointment_date) {
      return NextResponse.json(
        { error: 'Appointment date and time are required.' },
        { status: 400 }
      )
    }

    const { data: newAppt, error: insertErr } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        doctor_name: doctor_name?.trim() || 'Attending Physician',
        hospital_name: hospital_name?.trim() || null,
        appointment_date: new Date(appointment_date).toISOString(),
        notes: notes?.trim() || null,
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
      resource_type: 'appointment',
      resource_id: newAppt.id,
      details: { doctor_name: newAppt.doctor_name, date: newAppt.appointment_date },
    })

    return NextResponse.json({ success: true, appointment: newAppt }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
