-- Safe Database Migration for File Upload Features
-- This script safely adds new tables and columns without affecting existing data

-- Enable necessary extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversation_files table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.conversation_files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  extracted_text text,
  anthropic_file_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create message_files table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.message_files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_id uuid REFERENCES public.conversation_files(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for file tables (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_conversation_files_conversation_id 
ON public.conversation_files(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_files_created_at 
ON public.conversation_files(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_files_message_id 
ON public.message_files(message_id);

CREATE INDEX IF NOT EXISTS idx_message_files_file_id 
ON public.message_files(file_id);

-- Enable RLS on file tables (safe to run multiple times)
ALTER TABLE public.conversation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file tables (drop if exists, then create)
DROP POLICY IF EXISTS "Allow all for conversation_files" ON public.conversation_files;
CREATE POLICY "Allow all for conversation_files" 
ON public.conversation_files FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for message_files" ON public.message_files;  
CREATE POLICY "Allow all for message_files" 
ON public.message_files FOR ALL USING (true);

-- Verify the migration completed successfully
SELECT 
  'Migration completed successfully' as status,
  current_timestamp as completed_at;

-- Show summary of all tables
SELECT 
  table_name,
  'Ready' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY table_name;