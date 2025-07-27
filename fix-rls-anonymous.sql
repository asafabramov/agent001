-- Fix RLS policies to allow anonymous file uploads
-- Run this in your Supabase SQL Editor

-- Allow anonymous users to insert into conversation_files
CREATE POLICY "Allow anonymous inserts for conversation_files" 
ON public.conversation_files 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anonymous users to select from conversation_files
CREATE POLICY "Allow anonymous selects for conversation_files" 
ON public.conversation_files 
FOR SELECT 
TO anon 
USING (true);

-- Allow anonymous users to insert into message_files
CREATE POLICY "Allow anonymous inserts for message_files"
ON public.message_files 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anonymous users to select from message_files
CREATE POLICY "Allow anonymous selects for message_files"
ON public.message_files 
FOR SELECT 
TO anon 
USING (true);

-- Also ensure conversations and messages allow anonymous access
CREATE POLICY "Allow anonymous inserts for conversations" 
ON public.conversations 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects for conversations" 
ON public.conversations 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Allow anonymous updates for conversations" 
ON public.conversations 
FOR UPDATE 
TO anon 
USING (true);

CREATE POLICY "Allow anonymous inserts for messages" 
ON public.messages 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects for messages" 
ON public.messages 
FOR SELECT 
TO anon 
USING (true);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY tablename, policyname;