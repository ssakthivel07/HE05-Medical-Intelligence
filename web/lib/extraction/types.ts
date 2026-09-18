import type { MedicalDocument } from '../types'

export interface ExtractionEvidence {
  page_number?: number
  text_snippet?: string
  confidence?: number
}

export interface ExtractedEvent {
  event_type: string
  event_date: string
  title: string
  description: string
  confidence: number
  is_verified?: boolean
  evidence?: ExtractionEvidence
}

export interface ExtractedMedication {
  medicine_name: string
  dosage?: string
  frequency?: string
  duration?: string
  start_date?: string
  end_date?: string
  confidence?: number
  evidence?: ExtractionEvidence
}

export interface ExtractedDocumentData {
  document_type: string
  document_date?: string
  hospital_name?: string
  doctor_name?: string
  summary?: string
  events: ExtractedEvent[]
  medications: ExtractedMedication[]
}

export interface ExtractionRequest {
  document: MedicalDocument
  signedUrl?: string | null
}

export interface MedicalDocumentExtractor {
  name: string
  extract(request: ExtractionRequest): Promise<ExtractedDocumentData>
}
