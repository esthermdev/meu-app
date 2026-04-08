-- Migration: chat_online_column_compat
-- Created at: 2026-04-07

-- Compatibility migration for environments where the previous column name
-- `is_admin_chat_available` may already exist.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_admin_chat_available'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_chat_online'
  ) then
    alter table public.profiles
      rename column is_admin_chat_available to is_chat_online;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_chat_online'
  ) then
    alter table public.profiles
      add column is_chat_online boolean default true;
  end if;

  update public.profiles
  set is_chat_online = true
  where is_chat_online is null;

  alter table public.profiles
    alter column is_chat_online set not null;
end $$;
