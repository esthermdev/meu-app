-- Migration: admin_chat_notifications_toggle
-- Created at: 2026-04-07

-- Admin-specific chat notification availability switch.
alter table public.profiles
  add column if not exists is_chat_online boolean default true;

update public.profiles
set is_chat_online = true
where is_chat_online is null;

alter table public.profiles
  alter column is_chat_online set not null;
