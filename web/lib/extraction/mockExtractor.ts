import type {
  MedicalDocumentExtractor,
  ExtractionRequest,
  ExtractedDocumentData,
  ExtractedEvent,
  ExtractedMedication,
} from './types'

function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  } catch {
    return dateStr
  }
}

export class MockDemoExtractor implements MedicalDocumentExtractor {
  name = 'SafeMockDemoExtractor'

  async extract(request: ExtractionRequest): Promise<ExtractedDocumentData> {
    const { document } = request
    const docTypeLower = (document.document_type || '').toLowerCase()
    const fileNameLower = (document.file_name || '').toLowerCase()

    // Simulate realistic AI/OCR processing latency (650ms)
    await new Promise((resolve) => setTimeout(resolve, 650))

    // Check for legacy Word .doc format which requires conversion
    if (fileNameLower.endsWith('.doc') && !fileNameLower.endsWith('.docx')) {
      throw new Error(
        'Legacy Word (.doc) binary format requires conversion to modern .docx or PDF for automated text extraction.'
      )
    }

    const docDate =
      document.document_date ||
      new Date().toISOString().slice(0, 10)

    const hospital =
      document.hospital_name ||
      'City General Medical Center'

    const doctor =
      document.doctor_name ||
      'Dr. Sarah Jenkins, MD'

    const isImage =
      fileNameLower.endsWith('.jpg') ||
      fileNameLower.endsWith('.jpeg') ||
      fileNameLower.endsWith('.png') ||
      fileNameLower.endsWith('.webp') ||
      docTypeLower.includes('scan') ||
      docTypeLower.includes('image')

    const isWord = fileNameLower.endsWith('.docx') || docTypeLower.includes('word')

    let events: ExtractedEvent[] = []
    let medications: ExtractedMedication[] = []

    // 1. Lab Report / Blood Test / Pathology
    if (
      docTypeLower.includes('lab') ||
      docTypeLower.includes('test') ||
      fileNameLower.includes('cbc') ||
      fileNameLower.includes('blood') ||
      fileNameLower.includes('lab') ||
      fileNameLower.includes('lipid')
    ) {
      const isLipid = fileNameLower.includes('lipid') || docTypeLower.includes('lipid')

      if (isLipid) {
        events = [
          {
            event_type: 'laboratory_test',
            event_date: docDate,
            title: 'Comprehensive Lipid Profile Panel',
            description:
              'Total Cholesterol: 188 mg/dL (Desirable <200), HDL: 54 mg/dL (>40), LDL: 104 mg/dL (Optimal <100), Triglycerides: 135 mg/dL (<150). Overall cardiovascular lipid indices within target range.',
            confidence: 0.95,
            is_verified: false,
            evidence: {
              page_number: 1,
              text_snippet:
                'LIPID PROFILE: Cholesterol Total 188 mg/dL, HDL 54 mg/dL, LDL 104 mg/dL, Triglycerides 135 mg/dL. Status: Desirable.',
              confidence: 0.95,
            },
          },
        ]

        medications = [
          {
            medicine_name: 'Atorvastatin',
            dosage: '10 mg',
            frequency: 'Once daily at bedtime',
            duration: '90 days',
            start_date: docDate,
            end_date: addDays(docDate, 90),
            confidence: 0.92,
            evidence: {
              page_number: 1,
              text_snippet: 'Recommendation: Maintain Atorvastatin 10mg daily for primary lipid management.',
              confidence: 0.92,
            },
          },
        ]
      } else {
        events = [
          {
            event_type: 'laboratory_test',
            event_date: docDate,
            title: 'Complete Blood Count (CBC) with Differential',
            description:
              'Hemoglobin: 14.2 g/dL (Ref: 13.5 - 17.5), WBC: 6,800 /mcL (Ref: 4,500 - 11,000), Platelets: 245,000 /mcL (Ref: 150,000 - 450,000), Hematocrit: 42.1%. All blood cell lines stable with normal morphology.',
            confidence: 0.96,
            is_verified: false,
            evidence: {
              page_number: 1,
              text_snippet:
                'CBC REPORT: Hgb 14.2 g/dL (Ref: 13.5-17.5), WBC 6.8 K/uL (Ref: 4.5-11.0), PLT 245 K/uL. All markers within normal limits.',
              confidence: 0.96,
            },
          },
        ]

        medications = []
      }
    }
    // 2. Prescription / Rx
    else if (
      docTypeLower.includes('prescription') ||
      docTypeLower.includes('rx') ||
      fileNameLower.includes('rx') ||
      fileNameLower.includes('prescription') ||
      fileNameLower.includes('med')
    ) {
      events = [
        {
          event_type: 'consultation',
          event_date: docDate,
          title: 'Physician Consultation & Prescription Issuance',
          description:
            'Clinical encounter for acute symptomatic presentation. Physical examination performed, vital signs stable. Formulated treatment regimen with oral medications.',
          confidence: 0.98,
          is_verified: false,
          evidence: {
            page_number: 1,
            text_snippet: `CLINICAL PRESCRIPTION: Patient examined on ${docDate}. Prescribed Amoxicillin and Paracetamol for targeted therapeutic relief.`,
            confidence: 0.98,
          },
        },
      ]

      medications = [
        {
          medicine_name: 'Amoxicillin',
          dosage: '500 mg',
          frequency: 'Three times daily (TID)',
          duration: '7 days',
          start_date: docDate,
          end_date: addDays(docDate, 7),
          confidence: 0.97,
          evidence: {
            page_number: 1,
            text_snippet: 'Rx 1: Amoxicillin 500mg capsule, 1 cap PO TID x 7 days with food.',
            confidence: 0.97,
          },
        },
        {
          medicine_name: 'Paracetamol',
          dosage: '650 mg',
          frequency: 'Every 6 hours as needed (PRN)',
          duration: '5 days',
          start_date: docDate,
          end_date: addDays(docDate, 5),
          confidence: 0.95,
          evidence: {
            page_number: 1,
            text_snippet: 'Rx 2: Paracetamol 650mg tablet, 1 tab PO q6h PRN for fever or pain.',
            confidence: 0.95,
          },
        },
      ]
    }
    // 3. Discharge Summary / Inpatient Note
    else if (
      docTypeLower.includes('discharge') ||
      fileNameLower.includes('discharge') ||
      fileNameLower.includes('hospital') ||
      docTypeLower.includes('summary')
    ) {
      events = [
        {
          event_type: 'hospital_admission',
          event_date: docDate,
          title: 'Inpatient Hospital Stay & Discharge Evaluation',
          description:
            'Inpatient admission concluded with clinical improvement. Patient afebrile with normalized physiological indices. Instructed on discharge precautions.',
          confidence: 0.94,
          is_verified: false,
          evidence: {
            page_number: 1,
            text_snippet:
              'DISCHARGE SUMMARY: Patient discharged in stable clinical state. Vitals normal, wound sites healing appropriately.',
            confidence: 0.94,
          },
        },
        {
          event_type: 'follow_up',
          event_date: addDays(docDate, 14),
          title: 'Scheduled Outpatient Post-Discharge Follow-up',
          description:
            'Follow-up outpatient appointment scheduled to assess sustained recovery and medication response.',
          confidence: 0.91,
          is_verified: false,
          evidence: {
            page_number: 2,
            text_snippet:
              'DISCHARGE PLAN: Schedule outpatient physician follow-up in 2 weeks for postoperative evaluation.',
            confidence: 0.91,
          },
        },
      ]

      medications = [
        {
          medicine_name: 'Pantoprazole',
          dosage: '40 mg',
          frequency: 'Once daily before breakfast',
          duration: '14 days',
          start_date: docDate,
          end_date: addDays(docDate, 14),
          confidence: 0.93,
          evidence: {
            page_number: 2,
            text_snippet: 'Discharge Med: Pantoprazole 40mg tab daily in AM for 14 days.',
            confidence: 0.93,
          },
        },
      ]
    }
    // 4. Default: General Health Record / Diagnostic Scan
    else {
      const isScan =
        fileNameLower.includes('scan') ||
        fileNameLower.includes('xray') ||
        fileNameLower.includes('mri') ||
        docTypeLower.includes('imaging')

      if (isScan) {
        events = [
          {
            event_type: 'diagnostic_imaging',
            event_date: docDate,
            title: 'Diagnostic Radiologic Imaging Scan',
            description:
              'Imaging series reviewed. No acute bony abnormalities, consolidations, or focal lesions identified. Anatomical architecture normal.',
            confidence: 0.93,
            is_verified: false,
            evidence: {
              page_number: 1,
              text_snippet:
                'RADIOLOGY REPORT: Clear lung fields bilaterally. Cardiac silhouette within normal limits. Impression: Normal examination.',
              confidence: 0.93,
            },
          },
        ]
        medications = []
      } else {
        events = [
          {
            event_type: 'clinical_note',
            event_date: docDate,
            title: 'Comprehensive Medical Assessment & Review',
            description:
              'Routine health checkup. Vital signs: BP 118/76 mmHg, HR 72 bpm, SpO2 99%. Systematic organ review demonstrated unremarkable findings.',
            confidence: 0.92,
            is_verified: false,
            evidence: {
              page_number: 1,
              text_snippet:
                'CLINICAL ASSESSMENT: Normotensive, regular rhythm, clear respiratory sounds. Patient cleared with good functional status.',
              confidence: 0.92,
            },
          },
        ]

        medications = [
          {
            medicine_name: 'Multivitamin & Zinc Formula',
            dosage: '1 tablet',
            frequency: 'Once daily with meal',
            duration: '30 days',
            start_date: docDate,
            end_date: addDays(docDate, 30),
            confidence: 0.89,
            evidence: {
              page_number: 1,
              text_snippet: 'Advised daily multivitamin supplement with breakfast for nutritional support.',
              confidence: 0.89,
            },
          },
        ]
      }
    }

    return {
      document_type: document.document_type || 'Medical Record',
      document_date: docDate,
      hospital_name: hospital,
      doctor_name: doctor,
      summary: `Automated medical intelligence extraction completed. Identified ${events.length} medical event(s) and ${medications.length} medication record(s) with high confidence.`,
      events,
      medications,
    }
  }
}
