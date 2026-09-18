export interface PatientProfile {
  id: string
  owner_user_id: string
  full_name: string
  relationship?: 'self' | 'father' | 'mother' | 'child' | 'spouse' | 'other' | string
  date_of_birth?: string | null
  gender?: string | null
  blood_type?: string | null
  allergies?: string[] | null
  chronic_conditions?: string[] | null
  emergency_contact?: string | null
  is_primary?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface MedicalDocument {
  id: string
  patient_id: string
  uploaded_by?: string | null
  file_name: string
  storage_path?: string
  document_type: string
  document_date: string
  hospital_name?: string | null
  doctor_name?: string | null
  file_size_bytes?: number | null
  mime_type?: string | null
  processing_status: 'uploaded' | 'processing' | 'processed' | 'failed' | string
  extraction_summary?: string | null
  created_at?: string
  updated_at?: string
}

export interface MedicalEvent {
  id: string
  patient_id: string
  document_id?: string | null
  event_type:
    | 'laboratory_test'
    | 'prescription'
    | 'consultation'
    | 'hospital_admission'
    | 'diagnostic_imaging'
    | 'clinical_note'
    | 'surgery'
    | 'follow_up'
    | string
  event_date: string
  title: string
  description?: string | null
  confidence?: number | null
  is_verified?: boolean | null
  evidence_page?: number | null
  evidence_snippet?: string | null
  created_at?: string
}

export interface Medication {
  id: string
  patient_id: string
  document_id?: string | null
  medicine_name: string
  dosage?: string | null
  frequency?: string | null
  duration?: string | null
  start_date?: string | null
  end_date?: string | null
  instructions?: string | null
  prescribing_doctor?: string | null
  is_active?: boolean | null
  created_at?: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_name?: string | null
  hospital_name?: string | null
  specialty?: string | null
  appointment_date: string
  status?: 'scheduled' | 'completed' | 'cancelled' | string
  notes?: string | null
  reminder_minutes_before?: number | null
  created_at?: string
}

export interface FamilyPermission {
  id: string
  patient_id: string
  user_id: string
  caregiver_email?: string | null
  permission_level: 'view' | 'edit' | 'full' | string
  relationship?: string | null
  status?: 'active' | 'pending' | 'revoked' | string
  created_at?: string
}

export interface DoctorAccess {
  id: string
  patient_id: string
  doctor_user_id?: string | null
  doctor_name: string
  doctor_email?: string | null
  license_number?: string | null
  facility_name?: string | null
  access_level: 'read_only' | 'read_write' | string
  access_code?: string | null
  expires_at?: string | null
  created_at?: string
}

export interface Reminder {
  id: string
  patient_id: string
  user_id: string
  title: string
  category: 'medication' | 'appointment' | 'test_follow_up' | 'general' | string
  scheduled_time: string
  is_completed: boolean
  related_id?: string | null
  created_at?: string
}

export interface AuditLog {
  id: string
  user_id: string
  patient_id?: string | null
  action: string
  resource_type: string
  resource_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
}

export interface DuplicateTestAlert {
  testType: string
  currentDate: string
  previousDate: string
  daysApart: number
  previousDocumentId?: string
  previousDocumentName?: string
  message: string
}

export interface InconsistencyAlert {
  issueType: 'dosage_conflict' | 'timing_conflict' | 'duplicate_class'
  title: string
  description: string
  firstDoc: { id?: string; name?: string; date?: string; value: string }
  secondDoc: { id?: string; name?: string; date?: string; value: string }
  suggestedAction: string
}

export interface TimelineInsight {
  category: 'lab_trend' | 'medication_change' | 'procedure_history' | 'preventive_check' | 'timeline_pattern'
  title: string
  summary: string
  significance: 'info' | 'caution' | 'success'
  relatedDocumentIds?: string[]
}
