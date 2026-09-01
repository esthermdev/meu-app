-- Migration: spirit_scores
-- Created at: 2026-08-17T01:25:23.000Z

-- ============================================================
-- Spirit scoring: remembered team on profiles, spirit_scores
-- table, RLS, leaderboard + export views
-- ============================================================

-- 1. The team a user plays for, remembered between submissions.
--    ON DELETE SET NULL means a tournament reset (which removes teams)
--    clears everyone's saved team, so they are re-prompted to pick one.
alter table public.profiles
  add column if not exists team_id integer references public.teams(id) on delete set null;

-- 2. Spirit scores: one row per (game, scoring team).
--    rater_team_id is stored on the row rather than read through
--    profiles.team_id, so a user changing teams never rewrites history.
--    At tournament reset, delete games first: that cascades the spirit
--    scores away. Teams cannot be deleted before their games because
--    games_team1/2_id_fkey has no cascade of its own; the team cascades
--    below are a backstop for teams removed after their games are gone.
create table public.spirit_scores (
  id bigint generated always as identity primary key,
  game_id integer not null references public.games(id) on delete cascade,
  rater_team_id integer not null references public.teams(id) on delete cascade,
  rated_team_id integer not null references public.teams(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  score smallint not null check (score between 1 and 5),
  comments text,
  created_at timestamptz not null default now(),

  constraint spirit_scores_no_self_rating check (rater_team_id <> rated_team_id),
  -- The lock: a team gets exactly one submission per game, forever.
  constraint spirit_scores_one_per_team_per_game unique (game_id, rater_team_id)
);

-- The unique constraint indexes (game_id, rater_team_id); these serve
-- "games my team has already scored" and the leaderboard aggregate.
create index idx_spirit_scores_rater on public.spirit_scores(rater_team_id);
create index idx_spirit_scores_rated on public.spirit_scores(rated_team_id);

-- 3. Reject scores for a matchup that never happened. This cannot be a
--    CHECK constraint because it needs to look at another table.
create or replace function public.spirit_scores_validate_matchup()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.games g
    where g.id = new.game_id
      and ((g.team1_id = new.rater_team_id and g.team2_id = new.rated_team_id)
        or (g.team2_id = new.rater_team_id and g.team1_id = new.rated_team_id))
  ) then
    raise exception 'Teams % and % did not play each other in game %',
      new.rater_team_id, new.rated_team_id, new.game_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger spirit_scores_validate_matchup
  before insert on public.spirit_scores
  for each row execute function public.spirit_scores_validate_matchup();

-- 4. RLS. Note there is no UPDATE or DELETE policy for regular users:
--    that absence is what makes a submitted score permanent.
alter table public.spirit_scores enable row level security;

-- Users read only what their own team submitted. This drives the
-- "already scored" state in the app without revealing scores received.
create policy "Users see own team spirit scores"
  on public.spirit_scores for select
  using (
    rater_team_id = (select team_id from public.profiles where id = auth.uid())
  );

create policy "Admins see all spirit scores"
  on public.spirit_scores for select
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

create policy "Users submit spirit scores"
  on public.spirit_scores for insert
  with check (auth.uid() = submitted_by);

create policy "Admins update spirit scores"
  on public.spirit_scores for update
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

create policy "Admins delete spirit scores"
  on public.spirit_scores for delete
  using (
    exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = auth.uid() and r.key = 'admin'
    )
  );

-- 5. Public leaderboard.
--    Deliberately NOT security_invoker (unlike the other views in this
--    schema): it must expose aggregates to every user while the
--    underlying rows stay unreadable. Individual scores never leak,
--    only counts and averages.
create or replace view public.team_spirit_rankings as
select
  t.id as team_id,
  t.name,
  t.division_id,
  d.title as division,
  count(ss.id) as scores_received,
  round(avg(ss.score)::numeric, 1) as avg_score,
  rank() over (
    partition by t.division_id
    order by avg(ss.score) desc nulls last, count(ss.id) desc
  ) as division_rank
from public.teams t
  left join public.spirit_scores ss on ss.rated_team_id = t.id
  left join public.divisions d on d.id = t.division_id
where t.display
group by t.id, t.name, t.division_id, d.title;

grant select on public.team_spirit_rankings to anon, authenticated, service_role;

-- 6. Admin export, readable names instead of ids for CSV download.
--    security_invoker means RLS applies, so only admins see rows.
--    Run this before deleting teams at tournament reset: the cascade
--    in step 2 removes spirit history silently and there is no undo.
create or replace view public.spirit_scores_export with (security_invoker = on) as
select
  dt.date,
  dt.time,
  div.title as division,
  rater.name as scoring_team,
  rated.name as team_scored,
  ss.score,
  ss.comments,
  p.full_name as submitted_by,
  ss.created_at
from public.spirit_scores ss
  join public.teams rater on rater.id = ss.rater_team_id
  join public.teams rated on rated.id = ss.rated_team_id
  join public.games g on g.id = ss.game_id
  left join public.datetime dt on dt.id = g.datetime_id
  left join public.divisions div on div.id = g.division_id
  left join public.profiles p on p.id = ss.submitted_by
order by dt.date, dt.time;

grant select on public.spirit_scores_export to authenticated, service_role;

-- 7. Live leaderboard updates. Realtime cannot subscribe to a view, so
--    clients listen on the base table and refetch the rankings.
alter publication supabase_realtime add table public.spirit_scores;
