-- Migration: games_livestream_link
-- Created at: 2026-09-04T12:00:00.000Z

-- Optional YouTube (or other) livestream URL for a game. Filled in manually
-- by admins; the app shows a tappable "LIVE" badge on the game card once the
-- game's scheduled datetime has passed.
alter table public.games
  add column livestream_link text default null;

comment on column public.games.livestream_link is
  'Optional livestream URL (e.g. YouTube). Shown to users once the game has started.';
