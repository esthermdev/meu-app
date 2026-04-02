drop policy "Anyone can delete on anonymous_tokens" on "public"."anonymous_tokens";

drop policy "Anyone can insert to anonymous_tokens" on "public"."anonymous_tokens";

drop policy "Anyone can update on anonymous_tokens" on "public"."anonymous_tokens";

drop policy "Anyone can insert to cart_requests" on "public"."cart_requests";

drop policy "Anyone can read divisions" on "public"."divisions";

drop policy "Anyone can insert to feedback" on "public"."feedback";

drop policy "Anyone can read games" on "public"."games";

drop policy "Anyone can read gametypes" on "public"."gametypes";

drop policy "Anyone can insert to medical_requests" on "public"."medical_requests";

drop policy "Anyone can read notification_read_status" on "public"."notification_read_status";

drop policy "Anyone can read notifications" on "public"."notifications";

drop policy "Anyone can update on notifications" on "public"."notifications";

drop policy "Anyone can read permissions" on "public"."permissions";

drop policy "Anyone can read pools" on "public"."pools";

drop policy "Anyone can read profile_roles" on "public"."profile_roles";

drop policy "Anyone can read profiles" on "public"."profiles";

drop policy "Anyone can read rankings" on "public"."rankings";

drop policy "Anyone can read restaurants" on "public"."restaurants";

drop policy "Anyone can read role permissions" on "public"."role_permissions";

drop policy "Anyone can read roles" on "public"."roles";

drop policy "Anyone can read rounds" on "public"."rounds";

drop policy "Anyone can read scores" on "public"."scores";

drop policy "Anyone can read teams" on "public"."teams";

drop policy "Anyone can read vendors" on "public"."vendors";

drop policy "Anyone can read volunteers" on "public"."volunteers";

drop policy "Anyone can insert to water_requests" on "public"."water_requests";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_tiebreakers()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  curr_wins INT;
  num_teams INT;
  curr_rank INT;
  pool_id_var INT;
BEGIN
  -- Create a temporary table to store win counts
  CREATE TEMPORARY TABLE win_count AS
  SELECT t.pool_id, r.wins, COUNT(*) as cnt
  FROM rankings r
  JOIN teams t ON r.team_id = t.id
  GROUP BY t.pool_id, r.wins;

  -- Process each pool
  FOR pool_id_var IN SELECT DISTINCT pool_id FROM teams LOOP
    curr_rank := 1;

    -- Process teams in descending order of wins
    FOR curr_wins, num_teams IN 
      SELECT wins, cnt 
      FROM win_count 
      WHERE pool_id = pool_id_var
      ORDER BY wins DESC
    LOOP
      -- Always use tiebreakers, even for single teams
      WITH tied_teams AS (
        SELECT r.team_id, r.wins, r.losses
        FROM rankings r
        JOIN teams t ON r.team_id = t.id
        WHERE t.pool_id = pool_id_var AND r.wins = curr_wins
      ),
      game_results AS (
        SELECT 
          g.team1_id,
          g.team2_id,
          s.team1_score,
          s.team2_score,
          g.id AS game_id,
          CASE
            WHEN s.team1_score > s.team2_score THEN g.team1_id
            ELSE g.team2_id
          END AS winner_id
        FROM games g
        JOIN scores s ON s.game_id = g.id
        WHERE g.pool_id = pool_id_var
          AND s.is_finished = true
          AND (g.team1_id IN (SELECT team_id FROM tied_teams) OR g.team2_id IN (SELECT team_id FROM tied_teams))
      ),
      point_diff AS (
        SELECT
          t.team_id,
          SUM(
            CASE
              WHEN gr.team1_id = t.team_id THEN gr.team1_score - gr.team2_score
              ELSE gr.team2_score - gr.team1_score
            END
          ) AS point_differential
        FROM tied_teams t
        JOIN game_results gr ON t.team_id = gr.team1_id OR t.team_id = gr.team2_id
        GROUP BY t.team_id
      ),
      ranked_teams AS (
        SELECT
          t.team_id,
          t.wins,
          t.losses,
          COALESCE(pd.point_differential, 0) AS point_differential,
          ROW_NUMBER() OVER (
            ORDER BY
              t.wins DESC,
              COALESCE(pd.point_differential, 0) DESC
          ) AS calculated_rank
        FROM tied_teams t
        LEFT JOIN point_diff pd ON t.team_id = pd.team_id
      )
      UPDATE rankings r
      SET pool_rank = curr_rank + rt.calculated_rank - 1
      FROM ranked_teams rt
      WHERE r.team_id = rt.team_id;

      curr_rank := curr_rank + num_teams;
    END LOOP;
  END LOOP;

  -- Clean up
  DROP TABLE win_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_favorites_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Explicitly set an empty search path
    SET search_path = '';
    
    -- Use fully qualified table name
    IF (
        SELECT COUNT(*)
        FROM public.favorite_teams
        WHERE user_id = NEW.user_id
    ) >= 5 THEN
        RAISE EXCEPTION 'Users can only favorite up to 5 teams.';
    END IF;
    
    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.client_update_rankings_and_tiebreakers()
 RETURNS void
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Call the helper function
  PERFORM update_pool_rankings();
  PERFORM calculate_tiebreakers();
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_anonymous_token(p_device_id text, p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  existing_record_count INTEGER;
BEGIN
  -- Check if a record exists with this device_id
  SELECT COUNT(*) INTO existing_record_count 
  FROM public.anonymous_tokens
  WHERE device_id = p_device_id;
  
  -- If record exists, update it
  IF existing_record_count > 0 THEN
    UPDATE public.anonymous_tokens
    SET token = p_token,
        updated_at = NOW()
    WHERE device_id = p_device_id;
  -- Otherwise, insert a new record
  ELSE
    INSERT INTO public.anonymous_tokens (device_id, token, created_at, updated_at)
    VALUES (p_device_id, p_token, NOW(), NOW());
  END IF;
  
  -- Return success
  RETURN;
EXCEPTION
  WHEN unique_violation THEN
    -- If we somehow hit a constraint violation anyway,
    -- try again with a different approach
    DELETE FROM public.anonymous_tokens WHERE device_id = p_device_id;
    
    -- Small artificial delay to ensure deletion is processed
    PERFORM pg_sleep(0.5);
    
    -- Try insert again
    INSERT INTO public.anonymous_tokens (device_id, token, created_at, updated_at)
    VALUES (p_device_id, p_token, NOW(), NOW());
    
    RETURN;
  WHEN OTHERS THEN
    -- Log other exceptions but don't raise to client
    RAISE WARNING 'Error in handle_anonymous_token: %', SQLERRM;
    RETURN;
END;$function$
;

CREATE OR REPLACE FUNCTION public.insert_new_rankings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  game_record RECORD;
BEGIN
  -- Fetch the corresponding game record
  SELECT * INTO game_record FROM games WHERE id = NEW.game_id;
  
  -- Check if the new game is a pool play game (assuming round_id 1 is for pool play)
  IF NEW.round_id = 1 THEN
    -- Insert or update ranking for team1 if it's not null
    IF game_record.team1_id IS NOT NULL THEN
      INSERT INTO rankings (team_id, wins, losses, pool_rank)
      VALUES (game_record.team1_id, 0, 0, 0)
      ON CONFLICT (team_id) 
      DO UPDATE SET wins = rankings.wins, losses = rankings.losses, pool_rank = rankings.pool_rank;
    END IF;
    
    -- Insert or update ranking for team2 if it's not null
    IF game_record.team2_id IS NOT NULL THEN
      INSERT INTO rankings (team_id, wins, losses, pool_rank)
      VALUES (game_record.team2_id, 0, 0, 0)
      ON CONFLICT (team_id) 
      DO UPDATE SET wins = rankings.wins, losses = rankings.losses, pool_rank = rankings.pool_rank;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_new_score()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO scores (game_id, team1_score, team2_score, is_finished, round_id)
  VALUES (NEW.id, 0, 0, false, NEW.round_id);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.perform_rankings_and_tiebreakers()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Call the update_pool_rankings function
  PERFORM update_pool_rankings();
  
  -- Call the calculate_tiebreakers function
  PERFORM calculate_tiebreakers();
  
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.reset_bracket_scores(round_id_param integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE scores
  SET team1_score = 0, team2_score = 0, is_finished = false
  WHERE game_id IN (SELECT id FROM games WHERE round_id = round_id_param);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_pool_scores(pool_id_param integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Reset scores
  UPDATE scores
  SET team1_score = 0, team2_score = 0, is_finished = false
  WHERE game_id IN (SELECT id FROM games WHERE pool_id = pool_id_param);

  -- Reset rankings
  UPDATE rankings
  SET wins = 0, losses = 0, pool_rank = NULL
  WHERE team_id IN (SELECT id FROM teams WHERE pool_id = pool_id_param);

  -- Optionally, you can also reset other ranking-related fields if they exist
  -- For example, if you have fields like points_for, points_against, etc.
  -- UPDATE rankings
  -- SET points_for = 0, points_against = 0
  -- WHERE team_id IN (SELECT id FROM teams WHERE pool_id = pool_id_param);

END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_pool_rankings()
 RETURNS void
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Update wins and losses in the rankings table, considering only PP games for all divisions
  UPDATE rankings r
  SET 
    wins = (
      SELECT COUNT(*) 
      FROM games g
      JOIN scores s ON g.id = s.game_id
      JOIN teams t ON r.team_id = t.id
      JOIN pools p on g.pool_id = p.id
      
      WHERE ((g.team1_id = r.team_id AND s.team1_score > s.team2_score)
         OR (g.team2_id = r.team_id AND s.team2_score > s.team1_score))
         AND s.is_finished = true
         AND g.round_id = 1  -- Assuming round_id 1 represents Pool Play
         AND g.division_id = p.division_id  -- Ensure games are from the same division as the team
    ),
    losses = (
      SELECT COUNT(*) 
      FROM games g
      JOIN scores s ON g.id = s.game_id
      JOIN teams t ON r.team_id = t.id
      JOIN pools p on g.pool_id = p.id
      
      WHERE ((g.team1_id = r.team_id AND s.team1_score < s.team2_score)
         OR (g.team2_id = r.team_id AND s.team2_score < s.team1_score))
         AND s.is_finished = true
         AND g.round_id = 1  -- Assuming round_id 1 represents Pool Play
         AND g.division_id = p.division_id  -- Ensure games are from the same division as the team
    )
  WHERE EXISTS (
    SELECT 1 FROM teams t WHERE t.id = r.team_id
  );

  -- Update pool_rank based on wins (initial ranking) for each division and pool
  UPDATE rankings r
  SET pool_rank = subquery.rank
  FROM (
    SELECT 
      r.id,
      RANK() OVER (PARTITION BY t.pool_id ORDER BY r.wins DESC, r.losses ASC) as rank
    FROM rankings r
    JOIN teams t ON r.team_id = t.id
  ) AS subquery
  WHERE r.id = subquery.id;

END;$function$
;

create policy "Anyone can delete on anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for delete
to anon, authenticated
using (true);


create policy "Anyone can insert to anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can update on anonymous_tokens"
on "public"."anonymous_tokens"
as permissive
for update
to anon, authenticated
using (true)
with check (true);


create policy "Anyone can insert to cart_requests"
on "public"."cart_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read divisions"
on "public"."divisions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can insert to feedback"
on "public"."feedback"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read games"
on "public"."games"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read gametypes"
on "public"."gametypes"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can insert to medical_requests"
on "public"."medical_requests"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Anyone can read notification_read_status"
on "public"."notification_read_status"
as permissive
for select
to anon, authenticated
using ((auth.uid() = user_id));


create policy "Anyone can read notifications"
on "public"."notifications"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can update on notifications"
on "public"."notifications"
as permissive
for update
to anon, authenticated
using ((auth.uid() = user_id));


create policy "Anyone can read permissions"
on "public"."permissions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read pools"
on "public"."pools"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read profile_roles"
on "public"."profile_roles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read profiles"
on "public"."profiles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read rankings"
on "public"."rankings"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read restaurants"
on "public"."restaurants"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read role permissions"
on "public"."role_permissions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read roles"
on "public"."roles"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read rounds"
on "public"."rounds"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read scores"
on "public"."scores"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read teams"
on "public"."teams"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read vendors"
on "public"."vendors"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can read volunteers"
on "public"."volunteers"
as permissive
for select
to anon, authenticated
using (true);


create policy "Anyone can insert to water_requests"
on "public"."water_requests"
as permissive
for insert
to anon, authenticated
with check (true);



