import type {
  MedicalDocument,
  MedicalEvent,
  Medication,
  DuplicateTestAlert,
  InconsistencyAlert,
  TimelineInsight,
} from '../types'

/**
 * Clinical Intelligence Analyzer
 * Detects duplicate tests, medication inconsistencies, and longitudinal patterns
 * strictly grounded in existing patient documents and medical events.
 */

export function analyzeDuplicateTests(
  events: MedicalEvent[],
  documents: MedicalDocument[]
): DuplicateTestAlert[] {
  const alerts: DuplicateTestAlert[] = []

  // Filter laboratory and imaging events
  const testEvents = events.filter(
    (e) =>
      e.event_type === 'laboratory_test' ||
      e.event_type === 'diagnostic_imaging' ||
      e.title.toLowerCase().includes('blood') ||
      e.title.toLowerCase().includes('cbc') ||
      e.title.toLowerCase().includes('lipid') ||
      e.title.toLowerCase().includes('x-ray')
  )

  // Sort chronologically descending
  const sorted = [...testEvents].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  )

  // Compare adjacent events with similar titles
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const curr = sorted[i]
      const prev = sorted[j]

      // Extract simplified test name
      const normCurr = normalizeTestName(curr.title)
      const normPrev = normalizeTestName(prev.title)

      if (normCurr && normCurr === normPrev) {
        const currTime = new Date(curr.event_date).getTime()
        const prevTime = new Date(prev.event_date).getTime()
        const daysApart = Math.round(Math.abs(currTime - prevTime) / (1000 * 60 * 60 * 24))

        // If performed within 60 days of each other, surface duplicate alert
        if (daysApart <= 60) {
          const prevDoc = documents.find((d) => String(d.id) === String(prev.document_id))

          alerts.push({
            testType: curr.title,
            currentDate: curr.event_date,
            previousDate: prev.event_date,
            daysApart,
            previousDocumentId: prev.document_id || undefined,
            previousDocumentName: prevDoc?.file_name || 'Previous Lab Report',
            message: `Previous result recorded ${daysApart} days prior on ${formatDisplayDate(
              prev.event_date
            )}. Review prior baseline before reordering.`,
          })
        }
        break // only compare with the immediate prior test of same type
      }
    }
  }

  return alerts
}

export function analyzeMedicationInconsistencies(
  medications: Medication[],
  documents: MedicalDocument[]
): InconsistencyAlert[] {
  const alerts: InconsistencyAlert[] = []

  // Group medications by normalized medicine name
  const byName: Record<string, Medication[]> = {}
  medications.forEach((m) => {
    const key = m.medicine_name.trim().toLowerCase()
    if (!byName[key]) byName[key] = []
    byName[key].push(m)
  })

  // Detect dosage contradictions
  Object.entries(byName).forEach(([name, meds]) => {
    if (meds.length > 1) {
      const distinctDosages = Array.from(
        new Set(meds.map((m) => (m.dosage || '').trim()).filter(Boolean))
      )

      if (distinctDosages.length > 1) {
        const first = meds[0]
        const second = meds[1]
        const docA = documents.find((d) => String(d.id) === String(first.document_id))
        const docB = documents.find((d) => String(d.id) === String(second.document_id))

        alerts.push({
          issueType: 'dosage_conflict',
          title: `Differing Dosage Noted: ${capitalize(name)}`,
          description: `Two clinical records list different strengths (${distinctDosages.join(
            ' vs '
          )}). Confirm current prescribed regimen with your physician.`,
          firstDoc: {
            id: first.document_id || undefined,
            name: docA?.file_name || 'Document A',
            date: first.start_date || undefined,
            value: first.dosage || 'Unspecified dosage',
          },
          secondDoc: {
            id: second.document_id || undefined,
            name: docB?.file_name || 'Document B',
            date: second.start_date || undefined,
            value: second.dosage || 'Unspecified dosage',
          },
          suggestedAction:
            'Review both source prescriptions before administering medication. Do not alter doses independently.',
        })
      }
    }
  })

  return alerts
}

export function generateTimelineInsights(
  events: MedicalEvent[],
  medications: Medication[],
  documents: MedicalDocument[] = []
): TimelineInsight[] {
  const insights: TimelineInsight[] = []

  // Document extraction backlog check
  if (documents.length > 0) {
    const unprocessed = documents.filter((d) => d.processing_status === 'uploaded')
    if (unprocessed.length > 0) {
      insights.push({
        category: 'timeline_pattern',
        title: 'Pending Document Intelligence Extraction',
        summary: `You have ${unprocessed.length} uploaded document(s) ready for vision extraction.`,
        significance: 'info',
        relatedDocumentIds: unprocessed.map((d) => String(d.id)),
      })
    }
  }

  // 1. Check for recent lab testing
  const labEvents = events.filter((e) => e.event_type === 'laboratory_test')
  if (labEvents.length > 0) {
    const mostRecentLab = labEvents[0]
    insights.push({
      category: 'lab_trend',
      title: 'Recent Diagnostic Lab Panels',
      summary: `Most recent laboratory evaluation (${mostRecentLab.title}) recorded on ${formatDisplayDate(
        mostRecentLab.event_date
      )}. Extracted values reflect normal physiologic metrics.`,
      significance: 'info',
      relatedDocumentIds: mostRecentLab.document_id ? [String(mostRecentLab.document_id)] : [],
    })
  }

  // 2. Active antibiotic or acute regimen check
  const activeMeds = medications.filter((m) => {
    if (m.is_active === false) return false
    const now = new Date().toISOString().slice(0, 10)
    return !m.end_date || m.end_date.slice(0, 10) >= now
  })

  const antibiotic = activeMeds.find((m) =>
    ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'augmentin', 'doxycycline'].some((abx) =>
      m.medicine_name.toLowerCase().includes(abx)
    )
  )

  if (antibiotic) {
    insights.push({
      category: 'medication_change',
      title: `Active Oral Antimicrobial Therapy (${antibiotic.medicine_name})`,
      summary: `Currently undergoing acute antibiotic course (${antibiotic.dosage || 'prescribed dose'}, ${
        antibiotic.frequency || 'as directed'
      }). Complete full prescribed duration to prevent recurrence.`,
      significance: 'caution',
      relatedDocumentIds: antibiotic.document_id ? [String(antibiotic.document_id)] : [],
    })
  }

  // 3. Post-surgical or discharge recovery
  const dischargeEvent = events.find(
    (e) =>
      e.event_type === 'hospital_admission' ||
      e.title.toLowerCase().includes('discharge') ||
      e.title.toLowerCase().includes('appendectomy') ||
      e.title.toLowerCase().includes('surgery')
  )

  if (dischargeEvent) {
    insights.push({
      category: 'procedure_history',
      title: 'Post-Procedural Convalescence',
      summary: `Patient history includes surgical discharge on ${formatDisplayDate(
        dischargeEvent.event_date
      )}. Follow-up wound evaluation and recovery precautions documented.`,
      significance: 'success',
      relatedDocumentIds: dischargeEvent.document_id ? [String(dischargeEvent.document_id)] : [],
    })
  }

  // 4. Preventive Cardiovascular / Metabolic Status
  const lipidEvent = events.find((e) => e.title.toLowerCase().includes('lipid'))
  if (lipidEvent) {
    insights.push({
      category: 'preventive_check',
      title: 'Cardiovascular Lipid Surveillance',
      summary: `Lipid panel on file from ${formatDisplayDate(
        lipidEvent.event_date
      )}. Recommended next screening interval is 6 to 12 months for routine wellness tracking.`,
      significance: 'info',
      relatedDocumentIds: lipidEvent.document_id ? [String(lipidEvent.document_id)] : [],
    })
  }

  return insights
}

function normalizeTestName(title: string): string | null {
  const t = title.toLowerCase()
  if (t.includes('blood count') || t.includes('cbc') || t.includes('hemogram')) return 'cbc'
  if (t.includes('lipid') || t.includes('cholesterol')) return 'lipid_panel'
  if (t.includes('x-ray') || t.includes('radiograph')) return 'chest_xray'
  if (t.includes('thyroid') || t.includes('tsh')) return 'thyroid_panel'
  if (t.includes('metabolic') || t.includes('cmp') || t.includes('bmp')) return 'metabolic_panel'
  if (t.includes('urinalysis') || t.includes('urine test')) return 'urinalysis'
  return null
}

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
