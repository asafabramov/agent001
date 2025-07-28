-- Fix Storage and Authentication Issues
-- Run this in Supabase SQL Editor to fix file upload authorization issues

-- 1. First, create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files', 
  false, -- Private bucket for authenticated users
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
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create RLS policies for the storage bucket to allow authenticated users to upload
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-files');

-- 3. Update database tables to use proper user authentication
-- Update conversations table to reference auth.users properly
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE public.conversations ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Update RLS policies for database tables to use proper authentication
DROP POLICY IF EXISTS "Allow all for conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all for messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all for conversation_files" ON public.conversation_files;
DROP POLICY IF EXISTS "Allow all for message_files" ON public.message_files;

-- Create proper authenticated user policies for conversations
CREATE POLICY "Users can access own conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Create proper authenticated user policies for messages
CREATE POLICY "Users can access messages in own conversations" ON public.messages
  FOR ALL TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Create proper authenticated user policies for conversation files
CREATE POLICY "Users can access files in own conversations" ON public.conversation_files
  FOR ALL TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Create proper authenticated user policies for message files
CREATE POLICY "Users can access message-file links in own conversations" ON public.message_files
  FOR ALL TO authenticated
  USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- 5. Verify the bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'chat-files';

-- 6. Verify storage policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';