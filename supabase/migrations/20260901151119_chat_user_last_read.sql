-- Migration: chat_user_last_read
-- Created at: 2026-09-01T15:11:19.000Z

-- Track when a user last read their own conversation, so the Header can show
-- an unread indicator for admin replies (mirrors admin_last_read_at).
alter table public.conversations
  add column user_last_read_at timestamptz default null;
