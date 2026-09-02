-- Migration: move_handle_new_user_to_private_schema
-- Created at: 2026-09-02T17:58:32.949Z

-- ============================================================
-- Move handle_new_user to private schema
-- ============================================================
--
-- handle_new_user() is a trigger function that automatically
-- creates a profile when a new user signs up. It should never
-- be called directly by users via the REST API.
--
-- Moving it to the private schema:
-- 1. Removes it from REST API exposure (fixes security warning)
-- 2. Keeps it working as a trigger (cross-schema calls allowed)
-- 3. Maintains the automatic profile creation on signup

-- 1. Recreate the function in the private schema
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to private, public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- No public grants (internal trigger only)

-- 2. Update the trigger to call the private schema function
-- This recreates the trigger that runs on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- 3. Drop the old function from public schema
drop function if exists public.handle_new_user();
