# Quick Database Setup Guide

## Step-by-Step (Takes 2 minutes)

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard/projects
- Click your project: `mtqlrsdmgcechyvecjaa`
- Click **"SQL Editor"** in left sidebar
- Click **"New query"**

### 2. Copy & Paste This SQL
```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enable Row Level Security
alter table auth.users enable row level security;

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
  user_id uuid references public.profiles(id) on delete cascade not null,
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

-- RLS Policies

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Conversations policies
create policy "Users can view own conversations" on public.conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on public.conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view messages from own conversations" on public.messages
  for select using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can insert messages to own conversations" on public.messages
  for insert with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can update messages in own conversations" on public.messages
  for update using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can delete messages from own conversations" on public.messages
  for delete using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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
```

### 3. Click "Run"

### 4. Verify Success
- Check **"Table Editor"** - you should see 3 tables:
  - ✅ profiles
  - ✅ conversations  
  - ✅ messages

**Done! Your database is ready.** 🎉

The chatbot will work immediately after this setup.