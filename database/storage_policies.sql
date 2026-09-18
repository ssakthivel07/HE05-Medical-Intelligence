-- ==============================================================================
-- Medical Timeline Platform - Private Storage Bucket & RLS Policies
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor to configure the private
-- 'medical_documents' storage bucket and Row Level Security policies.
-- ==============================================================================

-- 1. Create or update the 'medical_documents' storage bucket as PRIVATE
-- Notice: public = false ensures files CANNOT be accessed via unauthenticated public URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical_documents',
  'medical_documents',
  false,
  15728640, -- 15 MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- 2. Drop existing policies if they already exist (ensures idempotent execution)
DROP POLICY IF EXISTS "Users can upload their own patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own patient documents" ON storage.objects;

-- NOTE: In Supabase, Row Level Security (RLS) is already enabled on storage.objects
-- by default. Do NOT run "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;"
-- as storage.objects is owned by the Supabase internal system role.

-- 3. Policy: Authenticated users can upload documents ONLY into their own folder
-- Path scheme: {authenticated_user_id}/{patient_id}/{unique_id}-{filename}
CREATE POLICY "Users can upload their own patient documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Authenticated users can read/download ONLY their own patient documents
CREATE POLICY "Users can view their own patient documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Authenticated users can delete ONLY their own patient documents (for rollback cleanup)
CREATE POLICY "Users can delete their own patient documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
