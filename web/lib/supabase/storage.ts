export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'medical_documents'

// Max upload size: 15 MB
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

// Allowed MIME types and corresponding extensions
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

// Explicitly blocked dangerous or executable extensions
export const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.html',
  '.htm',
  '.php',
  '.py',
  '.ps1',
  '.vbs',
  '.jar',
  '.com',
  '.scr',
  '.msi',
  '.dll',
]

/**
 * Normalizes and categorizes the document format: 'pdf' | 'image' | 'word' | 'other'
 */
export function detectDocumentFormat(
  fileName: string,
  mimeType?: string | null
): 'pdf' | 'image' | 'word' | 'other' {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  const mime = (mimeType || '').toLowerCase()

  if (ext === '.pdf' || mime === 'application/pdf') return 'pdf'
  if (
    ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return 'image'
  }
  if (
    ['.doc', '.docx'].includes(ext) ||
    mime === 'application/msword' ||
    mime.includes('wordprocessingml') ||
    mime.includes('officedocument')
  ) {
    return 'word'
  }
  return 'other'
}

/**
 * Normalizes document type label to prevent overly long or unsafe inputs.
 */
export function normalizeDocumentType(rawType?: string | null, fileName?: string): string {
  if (rawType && rawType.trim() && rawType.trim().length <= 50) {
    const clean = rawType.trim().replace(/[<>/"';`]/g, '')
    if (clean) return clean
  }
  if (fileName) {
    const fmt = detectDocumentFormat(fileName)
    if (fmt === 'pdf') return 'PDF Document'
    if (fmt === 'image') return 'Diagnostic Scan / Image'
    if (fmt === 'word') return 'Clinical Word Document'
  }
  return 'General Record'
}

/**
 * Sanitizes a filename to prevent path traversal, spaces, and unwanted characters.
 * Truncates base name to safe length and retains lowercase extension.
 */
export function sanitizeFileName(rawName: string): string {
  const cleanName = rawName.replace(/\\/g, '/').split('/').pop() || 'document'
  const lastDotIndex = cleanName.lastIndexOf('.')
  const ext = lastDotIndex !== -1 ? cleanName.slice(lastDotIndex).toLowerCase() : ''
  const base = lastDotIndex !== -1 ? cleanName.slice(0, lastDotIndex) : cleanName

  const safeBase = base
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50)

  return `${safeBase || 'document'}${ext}`
}

/**
 * Validates file type, extension, and size.
 * Returns null if valid, or a descriptive error message if invalid.
 */
export function validateDocumentFile(file: { name: string; size: number; type: string }): string | null {
  if (!file) {
    return 'Please select a file to upload.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return `File size (${sizeMb} MB) exceeds the maximum allowed limit of 15 MB.`
  }

  if (file.size === 0) {
    return 'The selected file is empty (0 bytes).'
  }

  const lastDotIndex = file.name.lastIndexOf('.')
  const ext = lastDotIndex !== -1 ? file.name.slice(lastDotIndex).toLowerCase() : ''

  // Reject executable or dangerous file extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return `Security error: Uploading executable or script files (${ext}) is strictly prohibited.`
  }

  const allowedTypes = Object.keys(ALLOWED_MIME_TYPES)
  const isAllowedMime = allowedTypes.includes(file.type.toLowerCase())
  const isAllowedExt = Object.values(ALLOWED_MIME_TYPES).some((exts) => exts.includes(ext))

  if (!isAllowedExt) {
    return 'Unsupported file format. Supported formats: PDF (.pdf), Images (.jpg, .jpeg, .png, .webp), and Word documents (.doc, .docx).'
  }

  // If MIME is provided and not generic octet-stream, check it against allowed
  if (file.type && file.type !== 'application/octet-stream' && !isAllowedMime) {
    // Some platforms report Word or WebP with alternative MIME types; if extension matches accepted list it is safe
    if (!isAllowedExt) {
      return `Invalid MIME type (${file.type}). Supported formats: PDF, Images (JPG, PNG, WEBP), and Word (.doc, .docx).`
    }
  }

  return null
}

/**
 * Generates a secure, user- and patient-scoped storage path.
 * Format: {userId}/{patientId}/{uniqueId}-{safeFileName}
 */
export function generateStoragePath(
  userId: string,
  patientId: string | number,
  originalName: string
): { safeFileName: string; storagePath: string } {
  const safeFileName = sanitizeFileName(originalName)
  const uniqueId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const storagePath = `${userId}/${patientId}/${uniqueId}-${safeFileName}`

  return { safeFileName, storagePath }
}
