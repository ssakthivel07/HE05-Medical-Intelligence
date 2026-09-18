import type {
  ExtractionRequest,
  ExtractedDocumentData,
  MedicalDocumentExtractor,
} from './types'
import { MockDemoExtractor } from './mockExtractor'

// Default extractor instance
const defaultExtractor: MedicalDocumentExtractor = new MockDemoExtractor()

// Registry for future extractors (e.g. OCR, Gemini Vision, Claude Medical, AWS Textract)
const extractorRegistry: Map<string, MedicalDocumentExtractor> = new Map([
  [defaultExtractor.name, defaultExtractor],
])

export function registerExtractor(extractor: MedicalDocumentExtractor) {
  extractorRegistry.set(extractor.name, extractor)
}

/**
 * Server-side document extraction pipeline entrypoint.
 * Automatically selects the appropriate extractor (defaulting to safe mock/demo extractor)
 * to produce structured medical events, medications, and source evidence.
 */
export async function extractMedicalDocument(
  request: ExtractionRequest,
  extractorName?: string
): Promise<ExtractedDocumentData> {
  const extractor =
    (extractorName && extractorRegistry.get(extractorName)) || defaultExtractor

  return await extractor.extract(request)
}
