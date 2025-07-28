-- Complete Supabase Database Reset and Clean Setup
-- This script will reset everything and create a clean, working setup

-- Step 1: Drop all existing tables and policies
DROP TABLE IF EXISTS public.message_files CASCADE;
DROP TABLE IF EXISTS public.conversation_files CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.conversations_backup CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Drop all functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 3: Remove storage objects and buckets
DELETE FROM storage.objects WHERE bucket_id IN ('chat-files', 'user-files');
DELETE FROM storage.buckets WHERE id IN ('chat-files', 'user-files');

-- Step 4: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 5: Create the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 7: Create conversations table
CREATE TABLE public.conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title_he text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 8: Create messages table
CREATE TABLE public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  role text CHECK (role IN ('user', 'assistant')) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 9: Create conversation_files table
CREATE TABLE public.conversation_files (
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

-- Step 10: Create message_files table
CREATE TABLE public.message_files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_id uuid REFERENCES public.conversation_files(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 11: Create indexes
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversation_files_conversation_id ON public.conversation_files(conversation_id);
CREATE INDEX idx_conversation_files_created_at ON public.conversation_files(created_at DESC);
CREATE INDEX idx_message_files_message_id ON public.message_files(message_id);
CREATE INDEX idx_message_files_file_id ON public.message_files(file_id);

-- Step 12: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_files ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 14: Create RLS policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Step 15: Create RLS policies for messages
CREATE POLICY "Users can view messages in own conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Step 16: Create RLS policies for conversation_files
CREATE POLICY "Users can view files in own conversations" ON public.conversation_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_files.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert files in own conversations" ON public.conversation_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_files.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete files in own conversations" ON public.conversation_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = conversation_files.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Step 17: Create RLS policies for message_files
CREATE POLICY "Users can view message files in own conversations" ON public.message_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      JOIN public.conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_files.message_id 
      AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert message files in own conversations" ON public.message_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      JOIN public.conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_files.message_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Step 18: Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 19: Create function for automatic profile creation
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

-- Step 20: Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 21: Create storage bucket
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

-- Final verification
SELECT 'Database reset and setup completed successfully!' as status;

-- Show all tables
SELECT table_name, 'Ready' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'conversations', 'messages', 'conversation_files', 'message_files')
ORDER BY table_name;