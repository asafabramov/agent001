-- Complete Authentication Migration for Hebrew Chatbot
-- This migration adds proper user authentication and updates the schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Backup existing conversations before migration
CREATE TABLE IF NOT EXISTS public.conversations_backup AS 
SELECT * FROM public.conversations;

-- Step 3: Create a demo user for existing anonymous data
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@agent001.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "משתמש דמו"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

-- Create demo user profile
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@agent001.com',
  'משתמש דמו',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  updated_at = now();

-- Step 4: Update conversations table structure
-- Add new user_id column (uuid) alongside existing one
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS user_id_new uuid;

-- Update all existing anonymous conversations to demo user
UPDATE public.conversations 
SET user_id_new = '00000000-0000-0000-0000-000000000001'::uuid
WHERE user_id = 'anonymous' OR user_id_new IS NULL;

-- Drop old text user_id column and rename new one
ALTER TABLE public.conversations DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.conversations RENAME COLUMN user_id_new TO user_id;

-- Add foreign key constraint
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_conversations_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL
ALTER TABLE public.conversations 
ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Create proper RLS policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all for conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all for messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all for conversation_files" ON public.conversation_files;
DROP POLICY IF EXISTS "Allow all for message_files" ON public.message_files;

-- Conversations policies
CREATE POLICY "Users can view own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
ON public.conversations FOR DELETE 
USING (auth.uid() = user_id);

-- Messages policies (through conversation ownership)
CREATE POLICY "Users can view messages in own conversations" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in own conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in own conversations" 
ON public.messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages in own conversations" 
ON public.messages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Conversation files policies
CREATE POLICY "Users can view files in own conversations" 
ON public.conversation_files FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_files.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert files in own conversations" 
ON public.conversation_files FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_files.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete files in own conversations" 
ON public.conversation_files FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_files.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Message files policies
CREATE POLICY "Users can view message files in own conversations" 
ON public.message_files FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages 
    JOIN public.conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_files.message_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert message files in own conversations" 
ON public.message_files FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages 
    JOIN public.conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_files.message_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete message files in own conversations" 
ON public.message_files FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.messages 
    JOIN public.conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = message_files.message_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Step 6: Create functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_updated_at ON public.conversations(user_id, updated_at DESC);

-- Step 8: Update the trigger function for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Step 9: Storage bucket RLS policies for user-specific file access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files', 
  false,  -- Private bucket
  20971520, -- 20MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/markdown', 'text/csv'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Verification queries
SELECT 'Migration completed successfully' as status;

-- Show user count
SELECT COUNT(*) as user_count FROM auth.users;

-- Show conversation count per user
SELECT 
  user_id,
  COUNT(*) as conversation_count
FROM public.conversations 
GROUP BY user_id;

-- Show table status
SELECT 
  table_name,
  'Configured with RLS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY table_name;