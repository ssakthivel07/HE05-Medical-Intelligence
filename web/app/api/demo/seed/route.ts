import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerUser } from '../../../../lib/supabase/ssrClient'
import { ACTIVE_PATIENT_COOKIE } from '../../../../lib/supabase/patientContext'

export async function POST() {
  try {
    const { supabase, user } = await getServerUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    // 1. Check if demo profile already exists for this user
    const { data: existingProfiles } = await supabase
      .from('patient_profiles')
      .select('id, full_name')
      .eq('owner_user_id', user.id)

    let demoProfile = existingProfiles?.find((p) =>
      p.full_name.toLowerCase().includes('ananya sharma')
    )

    if (!demoProfile) {
      // Create fictional demo patient profile
      const { data: newProfile, error: profileErr } = await supabase
        .from('patient_profiles')
        .insert([
          {
            owner_user_id: user.id,
            full_name: 'Ananya Sharma (Demo)',
            date_of_birth: '1992-06-15',
            gender: 'female',
          },
        ])
        .select()
        .single()

      if (profileErr || !newProfile) {
        throw new Error(profileErr?.message || 'Failed to create demo profile')
      }
      demoProfile = newProfile
    }

    if (!demoProfile) {
      return NextResponse.json({ error: 'Failed to initialize demo patient profile.' }, { status: 500 })
    }

    const patientId = demoProfile.id

    // Check if documents already exist to prevent redundant duplicate inserts
    const { count: docCount } = await supabase
      .from('medical_documents')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId)

    if (!docCount || docCount === 0) {
      // 2. Insert Fictional Documents
      const docsPayload = [
        {
          patient_id: patientId,
          uploaded_by: user.id,
          file_name: 'CBC_Blood_Test_Report_Sep2026.pdf',
          storage_path: `${user.id}/${patientId}/demo-cbc-report.pdf`,
          document_type: 'Lab Report',
          document_date: '2026-09-18',
          hospital_name: 'Apex Pathology & Diagnostic Center',
          doctor_name: 'Dr. Sarah Jenkins, MD',
          processing_status: 'processed',
        },
        {
          patient_id: patientId,
          uploaded_by: user.id,
          file_name: 'Cardiovascular_Lipid_Panel_Aug2026.pdf',
          storage_path: `${user.id}/${patientId}/demo-lipid-panel.pdf`,
          document_type: 'Lab Report',
          document_date: '2026-08-15',
          hospital_name: 'Metropolitan Cardiac Care Center',
          doctor_name: 'Dr. Marcus Vance, Cardiologist',
          processing_status: 'processed',
        },
        {
          patient_id: patientId,
          uploaded_by: user.id,
          file_name: 'Clinical_Prescription_Sep2026.pdf',
          storage_path: `${user.id}/${patientId}/demo-rx.pdf`,
          document_type: 'Prescription',
          document_date: '2026-09-12',
          hospital_name: 'City Health Polyclinic',
          doctor_name: 'Dr. Rebecca Adams, MD',
          processing_status: 'processed',
        },
        {
          patient_id: patientId,
          uploaded_by: user.id,
          file_name: 'Appendectomy_Discharge_Summary_July2026.pdf',
          storage_path: `${user.id}/${patientId}/demo-discharge.pdf`,
          document_type: 'Discharge Summary',
          document_date: '2026-07-20',
          hospital_name: 'Memorial General Hospital',
          doctor_name: 'Dr. Anthony Davis, Chief of Surgery',
          processing_status: 'processed',
        },
        {
          patient_id: patientId,
          uploaded_by: user.id,
          file_name: 'Chest_XRay_PA_Lateral_July2026.pdf',
          storage_path: `${user.id}/${patientId}/demo-xray.pdf`,
          document_type: 'Diagnostic Scan',
          document_date: '2026-07-18',
          hospital_name: 'Memorial Radiologic Center',
          doctor_name: 'Dr. Elena Rostova, Radiologist',
          processing_status: 'processed',
        },
      ]

      const { data: insertedDocs, error: docErr } = await supabase
        .from('medical_documents')
        .insert(docsPayload)
        .select('id, file_name, document_type, document_date')

      if (docErr) {
        console.error('Error inserting demo docs:', docErr)
      }

      const docMap: Record<string, string> = {}
      if (insertedDocs) {
        insertedDocs.forEach((d) => {
          docMap[d.file_name] = d.id
        })
      }

      // 3. Insert Medical Events (Timeline)
      const cbcDocId = docMap['CBC_Blood_Test_Report_Sep2026.pdf'] || null
      const lipidDocId = docMap['Cardiovascular_Lipid_Panel_Aug2026.pdf'] || null
      const rxDocId = docMap['Clinical_Prescription_Sep2026.pdf'] || null
      const dischargeDocId = docMap['Appendectomy_Discharge_Summary_July2026.pdf'] || null
      const xrayDocId = docMap['Chest_XRay_PA_Lateral_July2026.pdf'] || null

      const eventsPayload = [
        {
          patient_id: patientId,
          document_id: cbcDocId,
          event_type: 'laboratory_test',
          event_date: '2026-09-18',
          title: 'Complete Blood Count (CBC) Panel',
          description:
            'Hemoglobin: 14.2 g/dL (Ref: 13.5 - 17.5), WBC: 6,800 /mcL (Ref: 4,500 - 11,000), Platelets: 245,000 /mcL. All markers stable with normal red and white cell morphology.',
          confidence: 0.96,
          is_verified: true,
        },
        {
          patient_id: patientId,
          document_id: rxDocId,
          event_type: 'prescription',
          event_date: '2026-09-12',
          title: 'Physician Consultation & Oral Antibiotic Therapy',
          description:
            'Clinical encounter for acute upper respiratory symptoms. Physical exam: chest clear bilaterally, vitals normotensive. Prescribed oral Amoxicillin and fever relief.',
          confidence: 0.98,
          is_verified: true,
        },
        {
          patient_id: patientId,
          document_id: lipidDocId,
          event_type: 'laboratory_test',
          event_date: '2026-08-15',
          title: 'Comprehensive Lipid Cardiovascular Panel',
          description:
            'Total Cholesterol: 188 mg/dL (Desirable <200), HDL: 54 mg/dL (>40), LDL: 104 mg/dL (Optimal <100), Triglycerides: 135 mg/dL (<150). Recommended routine dietary adherence.',
          confidence: 0.95,
          is_verified: true,
        },
        {
          patient_id: patientId,
          document_id: dischargeDocId,
          event_type: 'hospital_admission',
          event_date: '2026-07-20',
          title: 'Laparoscopic Appendectomy & Inpatient Discharge',
          description:
            'Uncomplicated laparoscopic procedure completed. Patient afebrile with normal inflammatory markers. Discharged home with surgical wound care guidance.',
          confidence: 0.94,
          is_verified: true,
        },
        {
          patient_id: patientId,
          document_id: xrayDocId,
          event_type: 'diagnostic_imaging',
          event_date: '2026-07-18',
          title: 'Chest Radiography (PA & Lateral Views)',
          description:
            'Preoperative cardiopulmonary clearance radiograph. Clear pleural spaces bilaterally with normal vascular markings. No acute infiltrates.',
          confidence: 0.93,
          is_verified: true,
        },
      ]

      const { data: insertedEvents } = await supabase
        .from('medical_events')
        .insert(eventsPayload)
        .select('id, document_id, title')

      // Insert event evidence if available
      if (insertedEvents && insertedEvents.length > 0) {
        const evidencePayload = insertedEvents
          .filter((ev) => ev.document_id)
          .map((ev) => ({
            event_id: ev.id,
            document_id: ev.document_id,
            page_number: 1,
            evidence_text: `Verified clinical evidence citation extracted for ${ev.title}.`,
          }))
        if (evidencePayload.length > 0) {
          await supabase.from('event_evidence').insert(evidencePayload)
        }
      }

      // 4. Insert Medications
      const medsPayload = [
        {
          patient_id: patientId,
          document_id: rxDocId,
          medicine_name: 'Amoxicillin',
          dosage: '500 mg',
          frequency: 'Three times daily (TID)',
          duration: '7 days',
          start_date: '2026-09-12',
          end_date: '2026-09-19',
        },
        {
          patient_id: patientId,
          document_id: rxDocId,
          medicine_name: 'Paracetamol',
          dosage: '650 mg',
          frequency: 'Every 6 hours as needed (PRN)',
          duration: '5 days',
          start_date: '2026-09-12',
          end_date: '2026-09-17',
        },
        {
          patient_id: patientId,
          document_id: lipidDocId,
          medicine_name: 'Omega-3 Fish Oil Concentrate',
          dosage: '1000 mg',
          frequency: 'Once daily with dinner',
          duration: '90 days',
          start_date: '2026-08-15',
          end_date: '2026-11-15',
        },
        {
          patient_id: patientId,
          document_id: dischargeDocId,
          medicine_name: 'Pantoprazole',
          dosage: '40 mg',
          frequency: 'Once daily before breakfast',
          duration: '14 days',
          start_date: '2026-07-20',
          end_date: '2026-08-03',
        },
      ]

      await supabase.from('medications').insert(medsPayload)

      // 5. Insert Appointments
      const now = new Date()
      const futureDate1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000)
      const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000)
      const pastDate1 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

      const apptsPayload = [
        {
          patient_id: patientId,
          doctor_name: 'Dr. Rebecca Adams',
          hospital_name: 'City Health Polyclinic',
          specialty: 'Internal Medicine',
          appointment_date: futureDate1.toISOString(),
          status: 'scheduled',
          notes: 'Respiratory follow-up post-antibiotic regimen and review of CBC blood count panel.',
        },
        {
          patient_id: patientId,
          doctor_name: 'Dr. Marcus Vance',
          hospital_name: 'Metropolitan Cardiac Care Center',
          specialty: 'Cardiology',
          appointment_date: futureDate2.toISOString(),
          status: 'scheduled',
          notes: 'Routine 6-month preventive cardiovascular wellness review and lipid panel evaluation.',
        },
        {
          patient_id: patientId,
          doctor_name: 'Dr. Anthony Davis',
          hospital_name: 'Memorial General Hospital',
          specialty: 'General Surgery',
          appointment_date: pastDate1.toISOString(),
          status: 'completed',
          notes: 'Post-operative 4-week follow-up and surgical wound evaluation. Patient cleared in excellent health.',
        },
      ]

      await supabase.from('appointments').insert(apptsPayload)
    }

    // 6. Set active patient cookie to demo patient
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_PATIENT_COOKIE, String(demoProfile.id), {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    // 7. Record Audit Log
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: user.id,
          patient_id: demoProfile.id,
          action: 'LOAD_DEMO_PATIENT',
          resource_type: 'patient_profiles',
          resource_id: String(demoProfile.id),
        },
      ])
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      ok: true,
      message: 'Fictional demo patient loaded successfully.',
      patient: demoProfile,
    })
  } catch (err: unknown) {
    console.error('Failed to seed demo patient:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error seeding demo patient.' },
      { status: 500 }
    )
  }
}
