-- Migration: chat_admin_last_read
-- Created at: 2026-04-06T19:33:27.220Z

-- Track when an admin last read each conversation
alter table public.conversations
  add column admin_last_read_at timestamptz default null;
