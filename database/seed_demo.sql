-- ==============================================================================
-- Medical Timeline Platform — Fictional Demo Seed Data
-- ==============================================================================
-- NOTE: ALL DATA IN THIS FILE IS ENTIRELY FICTIONAL AND CREATED FOR DEMONSTRATION.
-- DOES NOT CONTAIN ANY REAL PATIENT IDENTIFIERS OR MEDICAL INFORMATION.
-- ==============================================================================

-- Instructions: Replace 'YOUR_USER_UUID_HERE' with your Supabase auth.users id
-- if executing manually in the Supabase SQL editor.
-- Alternatively, use the in-app "Load Demo Patient" button on the dashboard.

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID; -- Replace or set dynamically
  demo_patient_id UUID;
  doc_cbc_id UUID;
  doc_lipid_id UUID;
  doc_rx_id UUID;
  doc_discharge_id UUID;
  doc_xray_id UUID;
BEGIN
  -- Insert or fetch demo patient
  INSERT INTO public.patient_profiles (
    owner_user_id,
    full_name,
    relationship,
    date_of_birth,
    gender,
    blood_type,
    allergies,
    chronic_conditions,
    emergency_contact,
    is_primary
  ) VALUES (
    demo_user_id,
    'Ananya Sharma (Demo)',
    'self',
    '1992-06-15',
    'female',
    'B Positive',
    ARRAY['Penicillin (mild rash)'],
    ARRAY['Mild Seasonal Allergic Rhinitis'],
    'Vikram Sharma (Spouse) - +1 (555) 019-2834',
    true
  ) RETURNING id INTO demo_patient_id;

  -- 1. Complete Blood Count Document
  INSERT INTO public.medical_documents (
    patient_id, uploaded_by, file_name, storage_path, document_type,
    document_date, hospital_name, doctor_name, processing_status, extraction_summary
  ) VALUES (
    demo_patient_id, demo_user_id, 'CBC_Lab_Report_Sep2026.pdf',
    demo_user_id || '/' || demo_patient_id || '/demo-cbc-report.pdf',
    'Lab Report', '2026-09-18', 'Apex Diagnostics & Pathology',
    'Dr. Sarah Jenkins, MD', 'processed',
    'Complete Blood Count: Hemoglobin 14.2 g/dL, WBC 6.8 K/uL, Platelets 245 K/uL. All markers within desirable baseline.'
  ) RETURNING id INTO doc_cbc_id;

  -- 2. Lipid Profile Document
  INSERT INTO public.medical_documents (
    patient_id, uploaded_by, file_name, storage_path, document_type,
    document_date, hospital_name, doctor_name, processing_status, extraction_summary
  ) VALUES (
    demo_patient_id, demo_user_id, 'Cardio_Lipid_Panel_Aug2026.pdf',
    demo_user_id || '/' || demo_patient_id || '/demo-lipid-panel.pdf',
    'Lab Report', '2026-08-15', 'Metropolitan Cardiac Care Center',
    'Dr. Marcus Vance, Cardiologist', 'processed',
    'Lipid Panel: Total Cholesterol 188 mg/dL, HDL 54 mg/dL, LDL 104 mg/dL, Triglycerides 135 mg/dL.'
  ) RETURNING id INTO doc_lipid_id;

  -- 3. Clinical Prescription Document
  INSERT INTO public.medical_documents (
    patient_id, uploaded_by, file_name, storage_path, document_type,
    document_date, hospital_name, doctor_name, processing_status, extraction_summary
  ) VALUES (
    demo_patient_id, demo_user_id, 'Outpatient_Rx_Sep2026.pdf',
    demo_user_id || '/' || demo_patient_id || '/demo-rx.pdf',
    'Prescription', '2026-09-12', 'City Health Polyclinic',
    'Dr. Rebecca Adams, MD', 'processed',
    'Prescription issued for respiratory tract symptoms: Amoxicillin 500mg TID x 7 days, Paracetamol 650mg PRN.'
  ) RETURNING id INTO doc_rx_id;

  -- 4. Discharge Summary Document
  INSERT INTO public.medical_documents (
    patient_id, uploaded_by, file_name, storage_path, document_type,
    document_date, hospital_name, doctor_name, processing_status, extraction_summary
  ) VALUES (
    demo_patient_id, demo_user_id, 'Discharge_Summary_July2026.pdf',
    demo_user_id || '/' || demo_patient_id || '/demo-discharge.pdf',
    'Discharge Summary', '2026-07-20', 'Memorial General Hospital',
    'Dr. Anthony Davis, Chief of Surgery', 'processed',
    'Inpatient laparoscopic appendectomy. Uneventful recovery. Discharged in stable condition with surgical wound care guidance.'
  ) RETURNING id INTO doc_discharge_id;

  -- 5. Chest X-Ray Imaging Document
  INSERT INTO public.medical_documents (
    patient_id, uploaded_by, file_name, storage_path, document_type,
    document_date, hospital_name, doctor_name, processing_status, extraction_summary
  ) VALUES (
    demo_patient_id, demo_user_id, 'Chest_XRay_Report_July2026.pdf',
    demo_user_id || '/' || demo_patient_id || '/demo-xray.pdf',
    'Diagnostic Scan', '2026-07-18', 'Memorial Radiologic Center',
    'Dr. Elena Rostova, Radiologist', 'processed',
    'PA and Lateral Chest Radiograph: Lungs clear bilaterally, normal cardiothoracic ratio, no acute cardiopulmonary disease.'
  ) RETURNING id INTO doc_xray_id;

  -- Timeline Events
  INSERT INTO public.medical_events (
    patient_id, document_id, event_type, event_date, title, description, confidence, is_verified, evidence_page, evidence_snippet
  ) VALUES
  (
    demo_patient_id, doc_cbc_id, 'laboratory_test', '2026-09-18',
    'Complete Blood Count (CBC) Panel',
    'Routine automated hematology assessment. Hemoglobin: 14.2 g/dL, WBC: 6,800 /mcL, Platelets: 245,000 /mcL, Hematocrit: 42.1%. All blood lines stable.',
    0.96, true, 1, 'CBC PANEL: Hgb 14.2 g/dL, WBC 6.8 K/uL, PLT 245 K/uL. Status: Normal baseline.'
  ),
  (
    demo_patient_id, doc_rx_id, 'prescription', '2026-09-12',
    'Clinical Consultation & Oral Antibiotic Therapy',
    'Outpatient medical evaluation for acute upper respiratory symptoms. Vital signs stable. Prescribed 7-day course of Amoxicillin and fever management with Paracetamol.',
    0.98, true, 1, 'PRESCRIPTION: Amoxicillin 500mg TID x 7d, Paracetamol 650mg q6h PRN for fever/pain.'
  ),
  (
    demo_patient_id, doc_lipid_id, 'laboratory_test', '2026-08-15',
    'Comprehensive Lipid Cardiovascular Profile',
    'Total Cholesterol: 188 mg/dL (Desirable <200), HDL: 54 mg/dL (>40), LDL: 104 mg/dL (Optimal <100), Triglycerides: 135 mg/dL (<150). Recommended routine dietary adherence.',
    0.95, true, 1, 'LIPID PROFILE: Cholesterol Total 188 mg/dL, HDL 54 mg/dL, LDL 104 mg/dL, Triglycerides 135 mg/dL.'
  ),
  (
    demo_patient_id, doc_discharge_id, 'hospital_admission', '2026-07-20',
    'Laparoscopic Appendectomy & Inpatient Discharge',
    'Uncomplicated laparoscopic procedure completed. Patient afebrile with normal inflammatory markers. Discharged home with outpatient suture removal scheduled.',
    0.94, true, 2, 'DISCHARGE NOTE: Laparoscopic appendectomy successfully performed. Surgical wounds clean, healing per primam.'
  ),
  (
    demo_patient_id, doc_xray_id, 'diagnostic_imaging', '2026-07-18',
    'Chest Radiography (PA & Lateral Views)',
    'Preoperative cardiopulmonary clearance radiograph. Clear pleural spaces bilaterally with normal vascular markings. No acute infiltrates.',
    0.93, true, 1, 'IMPRESSION: Normal chest radiograph without focal consolidation or pneumothorax.'
  );

  -- Active and Past Medications
  INSERT INTO public.medications (
    patient_id, document_id, medicine_name, dosage, frequency, duration, start_date, end_date, instructions, is_active
  ) VALUES
  (
    demo_patient_id, doc_rx_id, 'Amoxicillin', '500 mg',
    'Three times daily (TID)', '7 days', '2026-09-12', '2026-09-19',
    'Take with food to prevent gastrointestinal upset. Complete the full course.', true
  ),
  (
    demo_patient_id, doc_rx_id, 'Paracetamol', '650 mg',
    'Every 6 hours as needed (PRN)', '5 days', '2026-09-12', '2026-09-17',
    'Take only if fever or moderate pain is present. Do not exceed 3,000 mg daily.', false
  ),
  (
    demo_patient_id, doc_lipid_id, 'Omega-3 Fish Oil Concentrate', '1000 mg',
    'Once daily with dinner', '90 days', '2026-08-15', '2026-11-15',
    'Take with evening meal for optimal cardiovascular triglyceride support.', true
  ),
  (
    demo_patient_id, doc_discharge_id, 'Pantoprazole', '40 mg',
    'Once daily before breakfast', '14 days', '2026-07-20', '2026-08-03',
    'Gastroprotective agent prescribed during postoperative convalescence.', false
  );

  -- Scheduled Appointments
  INSERT INTO public.appointments (
    patient_id, doctor_name, hospital_name, specialty, appointment_date, status, notes
  ) VALUES
  (
    demo_patient_id, 'Dr. Rebecca Adams', 'City Health Polyclinic',
    'Internal Medicine', now() + INTERVAL '2 days' + INTERVAL '10 hours', 'scheduled',
    'Respiratory follow-up post-antibiotic regimen and review of blood count panel.'
  ),
  (
    demo_patient_id, 'Dr. Marcus Vance', 'Metropolitan Cardiac Care Center',
    'Cardiology', now() + INTERVAL '14 days' + INTERVAL '14 hours 30 minutes', 'scheduled',
    'Routine 6-month preventive cardiovascular checkup and dietary counseling.'
  ),
  (
    demo_patient_id, 'Dr. Anthony Davis', 'Memorial General Hospital',
    'General Surgery', now() - INTERVAL '45 days', 'completed',
    'Post-discharge 4-week follow-up and surgical wound evaluation. Patient cleared.'
  );

END $$;
