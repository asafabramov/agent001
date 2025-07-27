-- Database Status Check for Hebrew Chatbot
-- Run this in Supabase SQL Editor to check current database state

-- 1. Check if all required tables exist
SELECT 
  schemaname,
  tablename,
  'EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY tablename;

-- 2. Check conversations table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- 3. Check messages table structure  
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- 4. Check conversation_files table structure (NEW)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'conversation_files'
ORDER BY ordinal_position;

-- 5. Check message_files table structure (NEW)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'message_files'
ORDER BY ordinal_position;

-- 6. Check all indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY tablename, indexname;

-- 7. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY tablename, policyname;

-- 8. Check functions and triggers
SELECT 
  routine_name,
  routine_type,
  'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'update_updated_at_column';

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  'EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('conversations', 'messages', 'conversation_files', 'message_files');

-- 9. Check storage bucket (if exists)
-- This might not work in all environments
SELECT 
  name,
  created_at,
  public
FROM storage.buckets 
WHERE name = 'chat-files';

-- 10. Sample data count
SELECT 
  'conversations' as table_name,
  count(*) as record_count
FROM conversations
UNION ALL
SELECT 
  'messages' as table_name,
  count(*) as record_count  
FROM messages
UNION ALL
SELECT 
  'conversation_files' as table_name,
  count(*) as record_count
FROM conversation_files
UNION ALL
SELECT 
  'message_files' as table_name,
  count(*) as record_count
FROM message_files;