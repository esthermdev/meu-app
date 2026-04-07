-- Migration: chat_clear_messages
-- Created at: 2026-04-06T18:59:49.900Z

-- Allow users to delete messages in their own conversation
create policy "Users delete own messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Allow admins to delete messages in any conversation
create policy "Admins delete any messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );
