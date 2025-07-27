-- Production-ready database schema for Hebrew Chatbot
-- This schema avoids auth.users dependencies for immediate deployment

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create conversations table (simplified - no user auth for now)
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id text default 'anonymous' not null,
  title_he text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  content text not null,
  role text check (role in ('user', 'assistant')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_updated_at on public.conversations(updated_at desc);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at desc);

-- Enable Row Level Security
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Allow all operations for demo (you can add proper auth later)
create policy "Allow all for conversations" on public.conversations
  for all using (true);

create policy "Allow all for messages" on public.messages
  for all using (true);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on conversations
create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at_column();

-- Create conversation_files table for file uploads
create table public.conversation_files (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_path text not null,
  extracted_text text,
  anthropic_file_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create message_files table for file-message relationships
create table public.message_files (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  file_id uuid references public.conversation_files(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for file tables
create index idx_conversation_files_conversation_id on public.conversation_files(conversation_id);
create index idx_conversation_files_created_at on public.conversation_files(created_at desc);
create index idx_message_files_message_id on public.message_files(message_id);
create index idx_message_files_file_id on public.message_files(file_id);

-- Enable RLS on file tables
alter table public.conversation_files enable row level security;
alter table public.message_files enable row level security;

-- Allow all operations for file tables (demo mode)
create policy "Allow all for conversation_files" on public.conversation_files
  for all using (true);

create policy "Allow all for message_files" on public.message_files
  for all using (true);