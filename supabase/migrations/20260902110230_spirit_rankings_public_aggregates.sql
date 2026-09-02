-- Migration: spirit_rankings_public_aggregates
-- Created at: 2026-09-02T15:02:30.919Z

-- ============================================================
-- Spirit rankings are public: every user sees every division
-- ============================================================
--
-- 20260817012523_spirit_scores.sql created team_spirit_rankings as a
-- SECURITY DEFINER view so the aggregates stayed public while the
-- individual scores stayed private. Remotely the view ended up running
-- as SECURITY INVOKER (the Supabase advisor flags definer views), which
-- silently applied the spirit_scores RLS policies to the aggregate:
-- a regular user counted only the rows their own team submitted, so the
-- leaderboard showed just the teams they had rated, while an admin --
-- covered by "Admins see all spirit scores" -- saw the real thing.
--
-- Fix without reintroducing a definer view: the aggregate over the
-- protected table moves into a SECURITY DEFINER function, and the view
-- becomes a plain invoker view over teams/divisions (both already
-- publicly readable). Individual scores and comments stay unreadable --
-- the function returns a count and an average, nothing row-level.

create or replace function public.team_spirit_totals(p_team_id integer)
returns table (scores_received bigint, avg_score numeric)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::bigint, avg(ss.score)::numeric
  from public.spirit_scores ss
  where ss.rated_team_id = p_team_id;
$$;

grant execute on function public.team_spirit_totals(integer) to anon, authenticated, service_role;

-- Dropped rather than replaced so the stored security_invoker option is
-- rewritten instead of inherited from whatever the remote view carries.
drop view if exists public.team_spirit_rankings;

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
  left join lateral public.team_spirit_totals(t.id) s on true
where t.display;

grant select on public.team_spirit_rankings to anon, authenticated, service_role;
