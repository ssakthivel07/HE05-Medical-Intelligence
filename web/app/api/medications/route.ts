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
      .from('medications')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ medications: data })
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
    const { medicine_name, dosage, frequency, duration, start_date, end_date } = body

    if (!medicine_name || typeof medicine_name !== 'string' || !medicine_name.trim()) {
      return NextResponse.json(
        { error: 'Medicine name is required.' },
        { status: 400 }
      )
    }

    const { data: newMed, error: insertErr } = await supabase
      .from('medications')
      .insert({
        patient_id: patient.id,
        medicine_name: medicine_name.trim(),
        dosage: dosage?.trim() || null,
        frequency: frequency?.trim() || null,
        duration: duration?.trim() || null,
        start_date: start_date || new Date().toISOString().slice(0, 10),
        end_date: end_date || null,
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
      resource_type: 'medication',
      resource_id: newMed.id,
      details: { medicine_name: newMed.medicine_name, dosage: newMed.dosage },
    })

    return NextResponse.json({ success: true, medication: newMed }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
