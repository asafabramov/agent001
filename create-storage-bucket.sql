-- Manual Storage Bucket Creation for File Uploads
-- Run this in Supabase SQL Editor if automatic bucket creation fails

-- Create the storage bucket manually
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files', 
  true,
  20971520, -- 20MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/csv'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for the bucket
INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES ('chat-files', '.keep', '{}') ON CONFLICT DO NOTHING;

-- Check if bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'chat-files';