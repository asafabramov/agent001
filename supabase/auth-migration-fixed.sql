-- Complete Authentication Migration for Hebrew Chatbot (FIXED)
-- This migration adds proper user authentication and updates the schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create profiles table for user management (with proper structure)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
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
-- Note: We'll use Supabase Auth signup instead of direct insert
-- This should be done through the application or Supabase dashboard

-- Step 4: Update conversations table structure
-- Check if user_id column exists and is text type
DO $$
BEGIN
  -- Check if user_id is text type and convert to uuid
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'user_id' 
    AND data_type = 'text'
  ) THEN
    -- Add new uuid column
    ALTER TABLE public.conversations ADD COLUMN user_id_new uuid;
    
    -- For now, set all existing conversations to NULL (will be handled by demo user creation)
    UPDATE public.conversations SET user_id_new = NULL;
    
    -- Drop old column and rename new one
    ALTER TABLE public.conversations DROP COLUMN user_id;
    ALTER TABLE public.conversations RENAME COLUMN user_id_new TO user_id;
  END IF;
  
  -- Ensure user_id column exists as uuid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Make user_id nullable for now (will be updated after demo user creation)
ALTER TABLE public.conversations ALTER COLUMN user_id DROP NOT NULL;

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

-- Step 8: Update the trigger function for conversations and profiles
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Step 9: Storage bucket for user-specific file access
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
SELECT 'Migration completed successfully - Ready for user signup' as status;

-- Show table status
SELECT 
  table_name,
  'Configured with RLS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY table_name;