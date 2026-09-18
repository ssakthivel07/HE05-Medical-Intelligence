-- ==============================================================================
-- Medical Timeline Platform — Database Schema & Row Level Security (RLS)
-- ==============================================================================
-- Idempotent PostgreSQL schema for Supabase
-- Includes: patient_profiles, medical_documents, medical_events, medications,
-- appointments, family_permissions, audit_logs, reminders, doctor_access
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Patient Profiles Table
-- Supports multiple patient profiles per authenticated user account
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT DEFAULT 'self', -- 'self', 'father', 'mother', 'child', 'spouse', 'other'
  date_of_birth DATE,
  gender TEXT,
  blood_type TEXT,
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  chronic_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  emergency_contact TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Medical Documents Table
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'General Record',
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hospital_name TEXT,
  doctor_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  processing_status TEXT NOT NULL DEFAULT 'uploaded', -- 'uploaded', 'processing', 'processed', 'failed'
  extraction_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Medical Events Table (Timeline)
CREATE TABLE IF NOT EXISTS public.medical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'laboratory_test', 'prescription', 'consultation', 'hospital_admission', 'diagnostic_imaging', 'clinical_note', 'surgery', 'follow_up'
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence NUMERIC(3, 2), -- e.g. 0.95
  is_verified BOOLEAN DEFAULT false,
  evidence_page INTEGER,
  evidence_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT, -- e.g. 'Once daily in AM', 'Twice daily with meals'
  duration TEXT,
  start_date DATE,
  end_date DATE,
  instructions TEXT,
  prescribing_doctor TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  doctor_name TEXT,
  hospital_name TEXT,
  specialty TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  notes TEXT,
  reminder_minutes_before INTEGER DEFAULT 1440, -- default 24h before
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Family / Caregiver Permissions Table
CREATE TABLE IF NOT EXISTS public.family_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_email TEXT,
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'full'
  relationship TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'revoked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, user_id)
);

-- 8. Doctor / Provider Access Authorization
CREATE TABLE IF NOT EXISTS public.doctor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  doctor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  doctor_email TEXT,
  license_number TEXT,
  facility_name TEXT,
  access_level TEXT NOT NULL DEFAULT 'read_only', -- 'read_only', 'read_write'
  access_code TEXT, -- optional one-time pass-code for demo
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'medication', 'appointment', 'test_follow_up'
  scheduled_time TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  related_id UUID, -- links to medication_id or appointment_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Audit Logs Table (Immutable Health Access Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patient_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g. 'UPLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'PROCESS_DOCUMENT_AI', 'DELETE_DOCUMENT', 'SWITCH_PROFILE', 'DOCTOR_ACCESS'
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_patient_profiles_owner ON public.patient_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_date ON public.medical_documents(document_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_events_patient_date ON public.medical_events(patient_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, appointment_date ASC);
CREATE INDEX IF NOT EXISTS idx_family_permissions_user ON public.family_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_patient ON public.audit_logs(user_id, patient_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is owner OR authorized caregiver
CREATE OR REPLACE FUNCTION public.can_access_patient(target_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.patient_profiles
    WHERE id = target_patient_id AND owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.family_permissions
    WHERE patient_id = target_patient_id AND user_id = auth.uid() AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.doctor_access
    WHERE patient_id = target_patient_id AND doctor_user_id = auth.uid() AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for patient_profiles
DROP POLICY IF EXISTS "Users can manage their owned patient profiles" ON public.patient_profiles;
CREATE POLICY "Users can manage their owned patient profiles"
  ON public.patient_profiles
  FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Caregivers can view shared patient profiles" ON public.patient_profiles;
CREATE POLICY "Caregivers can view shared patient profiles"
  ON public.patient_profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT patient_id FROM public.family_permissions WHERE user_id = auth.uid() AND status = 'active')
    OR id IN (SELECT patient_id FROM public.doctor_access WHERE doctor_user_id = auth.uid())
  );

-- Policies for medical_documents
DROP POLICY IF EXISTS "Users can access documents for authorized patients" ON public.medical_documents;
CREATE POLICY "Users can access documents for authorized patients"
  ON public.medical_documents
  FOR ALL
  TO authenticated
  USING (public.can_access_patient(patient_id))
  WITH CHECK (public.can_access_patient(patient_id));

-- Policies for medical_events
DROP POLICY IF EXISTS "Users can access events for authorized patients" ON public.medical_events;
CREATE POLICY "Users can access events for authorized patients"
  ON public.medical_events
  FOR ALL
  TO authenticated
  USING (public.can_access_patient(patient_id))
  WITH CHECK (public.can_access_patient(patient_id));

-- Policies for medications
DROP POLICY IF EXISTS "Users can access medications for authorized patients" ON public.medications;
CREATE POLICY "Users can access medications for authorized patients"
  ON public.medications
  FOR ALL
  TO authenticated
  USING (public.can_access_patient(patient_id))
  WITH CHECK (public.can_access_patient(patient_id));

-- Policies for appointments
DROP POLICY IF EXISTS "Users can access appointments for authorized patients" ON public.appointments;
CREATE POLICY "Users can access appointments for authorized patients"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (public.can_access_patient(patient_id))
  WITH CHECK (public.can_access_patient(patient_id));

-- Policies for family_permissions
DROP POLICY IF EXISTS "Owners can manage family permissions" ON public.family_permissions;
CREATE POLICY "Owners can manage family permissions"
  ON public.family_permissions
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM public.patient_profiles WHERE owner_user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Policies for doctor_access
DROP POLICY IF EXISTS "Owners and Doctors can view doctor_access" ON public.doctor_access;
CREATE POLICY "Owners and Doctors can view doctor_access"
  ON public.doctor_access
  FOR ALL
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM public.patient_profiles WHERE owner_user_id = auth.uid())
    OR doctor_user_id = auth.uid()
  );

-- Policies for reminders
DROP POLICY IF EXISTS "Users can manage their reminders" ON public.reminders;
CREATE POLICY "Users can manage their reminders"
  ON public.reminders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for audit_logs
DROP POLICY IF EXISTS "Users can read and insert their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can read and insert their own audit logs"
  ON public.audit_logs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
