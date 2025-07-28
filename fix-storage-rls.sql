-- Fix storage bucket RLS policies for authenticated users
-- This ensures users can upload/access files in the user-files bucket

-- Create storage RLS policies for user-files bucket
-- Allow authenticated users to upload files to their own folders
INSERT INTO storage.policies (id, name, bucket_id, operation, definition)
VALUES 
  ('user-files-upload', 'Users can upload files to their own folder', 'user-files', 'INSERT', 
   'auth.uid()::text = (storage.foldername(name))[1]'),
  ('user-files-select', 'Users can view files in their own folder', 'user-files', 'SELECT', 
   'auth.uid()::text = (storage.foldername(name))[1]'),
  ('user-files-delete', 'Users can delete files in their own folder', 'user-files', 'DELETE', 
   'auth.uid()::text = (storage.foldername(name))[1]')
ON CONFLICT (id) DO NOTHING;

-- Verify storage bucket exists and is properly configured
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE name = 'user-files';

-- Check if storage policies were created
SELECT 
  id,
  name,
  bucket_id,
  operation,
  definition
FROM storage.policies 
WHERE bucket_id = 'user-files';