-- Migration: game_start_times
-- Created at: 2026-09-04T13:00:00.000Z

-- ============================================================
-- Server-side source of truth for "is this game live?"
-- ============================================================
--
-- datetime stores a game's `date` (a timestamptz at local midnight) and a
-- wall-clock `time` in the tournament's timezone (Maine => America/New_York).
-- Combining the two on the device would use the phone's timezone, so a user
-- abroad would see the LIVE badge at the wrong moment.
--
-- Instead, Postgres resolves the absolute start/end instants here. They are
-- STORED generated columns, so every existing `datetime: datetime_id (*)`
-- embed picks them up with no query changes, and the app only ever compares
-- two timestamptz values.
--
-- A game lasts 100 minutes. Change the interval below (and re-add the column)
-- if that rule ever changes.

alter table public.datetime
  add column starts_at timestamptz
    generated always as (
      timezone(
        'America/New_York',
        (timezone('America/New_York', date))::date + time
      )
    ) stored;

-- Note: the 100 minutes are added to the local wall-clock timestamp *before*
-- converting to an instant. `timestamptz + interval` is only STABLE in
-- Postgres (it depends on the session timezone), which a generated column
-- rejects; `timestamp + interval` is IMMUTABLE. The only observable difference
-- is for a game that straddles the 2am DST switch, which never happens.
alter table public.datetime
  add column ends_at timestamptz
    generated always as (
      timezone(
        'America/New_York',
        ((timezone('America/New_York', date))::date + time) + interval '100 minutes'
      )
    ) stored;

comment on column public.datetime.starts_at is
  'Absolute start instant, computed from date + time in America/New_York.';
comment on column public.datetime.ends_at is
  'starts_at + 100 minutes (standard game length).';

-- ============================================================
-- Server clock
-- ============================================================
--
-- The app asks for the server's current time once, keeps the offset from the
-- device clock, and ticks locally. This way the LIVE window is judged by the
-- server's clock even if the phone's clock or timezone is wrong.

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now();
$$;

grant execute on function public.get_server_time() to anon, authenticated;
