-- Migration: captain_role
-- Created at: 2026-09-21T12:00:00.000Z

-- Team captains. Captains carry no admin permissions; the role exists so the
-- home screen can show the Trainer and Spirit buttons to captains and admins
-- only, instead of to every player on a team.

-- roles.key is guarded by a CHECK constraint rather than an enum, so the list
-- has to be rewritten to let a new key in.
alter table public.roles
  drop constraint if exists roles_key_check;

alter table public.roles
  add constraint roles_key_check
  check (key = any (array['user'::text, 'admin'::text, 'captain'::text, 'medic'::text, 'driver'::text, 'volunteer'::text]));

insert into public.roles (key, name, description, is_default)
values (
  'captain',
  'Captain',
  'Team captain. Requests trainers and submits spirit scores on behalf of their team.',
  false
)
on conflict (key) do nothing;
