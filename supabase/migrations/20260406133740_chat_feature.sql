-- Migration: chat_feature
-- Created at: 2026-04-06T17:37:40.151Z

-- ============================================================
-- Chat feature: conversations + messages tables, RLS, storage
-- ============================================================

-- 1. Conversations table (one per user)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_user_id_key unique (user_id)
);

-- 2. Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content text,
  image_url text,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation_created on public.messages(conversation_id, created_at);

-- 3. Enable realtime for messages
alter publication supabase_realtime add table public.messages;

-- 4. RLS: conversations
alter table public.conversations enable row level security;

create policy "Users see own conversation"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Admins see all conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

create policy "Users create own conversation"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Admins update conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

create policy "Users update own conversation"
  on public.conversations for update
  using (auth.uid() = user_id);

-- 5. RLS: messages
alter table public.messages enable row level security;

create policy "Users see own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Admins see all messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

create policy "Users send in own conversation"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Admins send in any conversation"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

-- 6. Storage bucket for chat images
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

create policy "Authenticated users upload chat images"
  on storage.objects for insert
  with check (bucket_id = 'chat-images' and auth.role() = 'authenticated');

create policy "Anyone can view chat images"
  on storage.objects for select
  using (bucket_id = 'chat-images');
