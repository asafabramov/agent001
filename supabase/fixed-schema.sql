-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create conversations table
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null, -- Changed to text to avoid auth issues for now
  title_he text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on conversations
alter table public.conversations enable row level security;

-- Create messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  content text not null,
  role text check (role in ('user', 'assistant')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Create indexes for better performance
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_updated_at on public.conversations(updated_at desc);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at desc);

-- RLS Policies (simplified for demo)

-- Allow all operations for now (you can tighten security later)
create policy "Allow all for conversations" on public.conversations
  for all using (true);

create policy "Allow all for messages" on public.messages
  for all using (true);

create policy "Allow all for profiles" on public.profiles
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