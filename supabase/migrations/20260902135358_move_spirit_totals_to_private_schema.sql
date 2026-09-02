-- Migration: move_spirit_totals_to_private_schema
-- Created at: 2026-09-02T17:53:58.632Z

-- ============================================================
-- Move team_spirit_totals to private schema
-- ============================================================
--
-- The team_spirit_totals function is only meant to be called
-- internally by the team_spirit_rankings view. By moving it to
-- a private schema (not exposed by PostgREST), we prevent:
--
-- 1. Direct REST API calls by authenticated users
-- 2. The Supabase security advisor warning
--
-- While keeping the view working: cross-schema calls are allowed,
-- and the view's owner has permission to call the function.

-- 1. Create the private schema if it doesn't exist
create schema if not exists private;

-- 2. Create the function in the private schema
create or replace function private.team_spirit_totals(p_team_id integer)
returns table (scores_received bigint, avg_score numeric)
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select count(*)::bigint, avg(ss.score)::numeric
  from public.spirit_scores ss
  where ss.rated_team_id = p_team_id;
$$;

-- No grants on private schema functions (they're internal only)

-- 3. Drop the view first (it depends on the function)
drop view if exists public.team_spirit_rankings;

-- 4. Drop the old function from public schema
drop function if exists public.team_spirit_totals(integer);

-- 5. Recreate the view to call the function in private schema

create view public.team_spirit_rankings with (security_invoker = on) as
select
  t.id as team_id,
  t.name,
  t.division_id,
  d.title as division,
  s.scores_received,
  round(s.avg_score, 1) as avg_score,
  rank() over (
    partition by t.division_id
    order by s.avg_score desc nulls last, s.scores_received desc
  ) as division_rank
from public.teams t
  left join public.divisions d on d.id = t.division_id
  left join lateral private.team_spirit_totals(t.id) s on true
where t.display;

grant select on public.team_spirit_rankings to anon, authenticated, service_role;
