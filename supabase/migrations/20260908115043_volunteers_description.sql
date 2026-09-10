-- Migration: volunteers_description
-- Created at: 2026-09-08T11:50:43.000Z

-- Short bio shown in the volunteer detail pop-up on the Volunteers page.
-- Filled in manually by admins; the app falls back to a generic message when null.
alter table public.volunteers
  add column description text default null;

comment on column public.volunteers.description is
  'Short bio shown when a user taps the volunteer on the Volunteers page.';
