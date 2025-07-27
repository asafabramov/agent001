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