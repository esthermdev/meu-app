

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."division" AS ENUM (
    'X',
    'O',
    'W',
    'MU',
    'MM',
    'ML',
    'WU',
    'WL'
);


ALTER TYPE "public"."division" OWNER TO "postgres";


CREATE TYPE "public"."game_id" AS ENUM (
    'PP',
    'CP1',
    'CP2',
    'CP3',
    'CP4',
    'CP5',
    'CP6',
    'Q1',
    'Q2',
    'Q3',
    'Q4',
    'S1',
    'S2',
    'F',
    '3F',
    '5S1',
    '5S2',
    '5F',
    '7F',
    '9Q1',
    '9Q2',
    '9Q3',
    '9Q4',
    '9S1',
    '9S2',
    '9F',
    '11F',
    '13S1',
    '13S2',
    '13F',
    '15F',
    '9RR'
);


ALTER TYPE "public"."game_id" OWNER TO "postgres";


CREATE TYPE "public"."location_type" AS ENUM (
    'Field',
    'Entrance',
    'Tourney Central',
    'Lot 1 (Grass)',
    'Lot 2 (Pavement)'
);


ALTER TYPE "public"."location_type" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'pending',
    'confirmed',
    'resolved',
    'expired'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."request_type" AS ENUM (
    'medical',
    'water',
    'transport'
);


ALTER TYPE "public"."request_type" OWNER TO "postgres";


CREATE TYPE "public"."vendor_type" AS ENUM (
    'sponsor',
    'vendor'
);


ALTER TYPE "public"."vendor_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_tiebreakers"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_tiebreakers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_favorites_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
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
END;$$;


ALTER FUNCTION "public"."check_favorites_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."client_update_rankings_and_tiebreakers"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Call the helper function
  PERFORM update_pool_rankings();
  PERFORM calculate_tiebreakers();
END;$$;


ALTER FUNCTION "public"."client_update_rankings_and_tiebreakers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_profile_role_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.role_id is null then
    new.role_id := public.get_default_role_id();
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_profile_role_default"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_default_role_id"() RETURNS smallint
    LANGUAGE "sql" STABLE
    AS $$
  select r.id
  from public.roles r
  where r.is_default = true
  limit 1;
$$;


ALTER FUNCTION "public"."get_default_role_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_access"("p_profile_id" "uuid") RETURNS TABLE("role_keys" "text"[], "permission_keys" "text"[])
    LANGUAGE "sql" STABLE
    AS $$
  with assigned_roles as (
    select distinct r.key
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = p_profile_id
  ),
  assigned_permissions as (
    select distinct p.key
    from public.profile_roles pr
    join public.role_permissions rp on rp.role_id = pr.role_id
    join public.permissions p on p.id = rp.permission_id
    where pr.profile_id = p_profile_id
  )
  select
    coalesce((select array_agg(ar.key order by ar.key) from assigned_roles ar), '{}'::text[]) as role_keys,
    coalesce((select array_agg(ap.key order by ap.key) from assigned_permissions ap), '{}'::text[]) as permission_keys;
$$;


ALTER FUNCTION "public"."get_profile_access"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_anonymous_token"("p_device_id" "text", "p_token" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
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
END;$$;


ALTER FUNCTION "public"."handle_anonymous_token"("p_device_id" "text", "p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_new_rankings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."insert_new_rankings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_new_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO scores (game_id, team1_score, team2_score, is_finished, round_id)
  VALUES (NEW.id, 0, 0, false, NEW.round_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_new_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."perform_rankings_and_tiebreakers"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Call the update_pool_rankings function
  PERFORM update_pool_rankings();
  
  -- Call the calculate_tiebreakers function
  PERFORM calculate_tiebreakers();
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."perform_rankings_and_tiebreakers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_bracket_scores"("round_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE scores
  SET team1_score = 0, team2_score = 0, is_finished = false
  WHERE game_id IN (SELECT id FROM games WHERE round_id = round_id_param);
END;
$$;


ALTER FUNCTION "public"."reset_bracket_scores"("round_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_pool_scores"("pool_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."reset_pool_scores"("pool_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_roles_primary_from_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.role_id is null then
    return new;
  end if;

  update public.profile_roles
  set is_primary = false
  where profile_id = new.id;

  insert into public.profile_roles (profile_id, role_id, is_primary)
  values (new.id, new.role_id, true)
  on conflict (profile_id, role_id)
  do update set is_primary = true;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_profile_roles_primary_from_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pool_rankings"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
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

END;$$;


ALTER FUNCTION "public"."update_pool_rankings"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."anonymous_tokens" (
    "id" integer NOT NULL,
    "device_id" "text" NOT NULL,
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."anonymous_tokens" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."anonymous_tokens_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."anonymous_tokens_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."anonymous_tokens_id_seq" OWNED BY "public"."anonymous_tokens"."id";



CREATE TABLE IF NOT EXISTS "public"."cart_requests" (
    "id" bigint NOT NULL,
    "from_location" "public"."location_type" NOT NULL,
    "to_location" "public"."location_type" NOT NULL,
    "from_field_number" integer,
    "to_field_number" integer,
    "status" "public"."request_status" DEFAULT 'pending'::"public"."request_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "requester_token" "text",
    "passenger_count" smallint,
    "special_request" "text" DEFAULT 'none'::"text",
    "driver" "uuid",
    "anon_device_id" "text",
    "requester" "text",
    "requester_id" "uuid",
    CONSTRAINT "check_from_field_number" CHECK (((("from_location" = 'Field'::"public"."location_type") AND ("from_field_number" IS NOT NULL)) OR (("from_location" <> 'Field'::"public"."location_type") AND ("from_field_number" IS NULL)))),
    CONSTRAINT "check_to_field_number" CHECK (((("to_location" = 'Field'::"public"."location_type") AND ("to_field_number" IS NOT NULL)) OR (("to_location" <> 'Field'::"public"."location_type") AND ("to_field_number" IS NULL))))
);


ALTER TABLE "public"."cart_requests" OWNER TO "postgres";


ALTER TABLE "public"."cart_requests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."cart_requests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."datetime_id_seq_new"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."datetime_id_seq_new" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."datetime" (
    "id" integer DEFAULT "nextval"('"public"."datetime_id_seq_new"'::"regclass") NOT NULL,
    "time" time without time zone NOT NULL,
    "date" timestamp with time zone
);


ALTER TABLE "public"."datetime" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."divisions" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "color" "text" NOT NULL,
    "icon" "text",
    "display_order" integer,
    "color_light" "text"
);


ALTER TABLE "public"."divisions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."divisions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."divisions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."divisions_id_seq" OWNED BY "public"."divisions"."id";



CREATE TABLE IF NOT EXISTS "public"."faq" (
    "id" bigint NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text"
);


ALTER TABLE "public"."faq" OWNER TO "postgres";


ALTER TABLE "public"."faq" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."faq_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."favorite_teams" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "team_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."favorite_teams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."favorite_teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."favorite_teams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."favorite_teams_id_seq" OWNED BY "public"."favorite_teams"."id";



CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subject" "text",
    "message" "text",
    "screenshots" "text"[],
    "display" boolean
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


ALTER TABLE "public"."feedback" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."feedback_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fields" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "location" "text"
);


ALTER TABLE "public"."fields" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fields_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."fields_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fields_id_seq" OWNED BY "public"."fields"."id";



CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" integer NOT NULL,
    "pool_id" integer,
    "team1_id" integer,
    "team2_id" integer,
    "field_id" integer,
    "round_id" integer,
    "datetime_id" integer,
    "division_id" integer,
    "gametype_id" integer
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gametypes" (
    "id" integer NOT NULL,
    "division_id" integer,
    "title" "text" NOT NULL,
    "route" "text" NOT NULL,
    "icon" "text",
    "icon_color" "text",
    "bg_color" "text",
    "display_order" integer
);


ALTER TABLE "public"."gametypes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" integer NOT NULL,
    "stage" "text" NOT NULL,
    "place" smallint
);


ALTER TABLE "public"."rounds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scores" (
    "id" integer NOT NULL,
    "game_id" integer,
    "team1_score" integer NOT NULL,
    "team2_score" integer NOT NULL,
    "is_finished" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."scores" REPLICA IDENTITY FULL;


ALTER TABLE "public"."scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "name" "text" NOT NULL,
    "avatar_uri" "text",
    "id" integer NOT NULL,
    "pool_id" integer,
    "seed" integer,
    "division_id" integer
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."full_gameview" WITH ("security_invoker"='on') AS
 SELECT "g"."id",
    "g"."pool_id",
    "g"."division_id",
    "divisions"."title" AS "division",
    "t1"."name" AS "team1_name",
    "t2"."name" AS "team2_name",
    "s"."team1_score",
    "s"."team2_score",
    "fields"."name" AS "field",
    "gametypes"."title" AS "gametype",
    "rounds"."stage",
    "datetime"."date",
    "datetime"."time"
   FROM (((((((("public"."games" "g"
     LEFT JOIN "public"."divisions" ON (("divisions"."id" = "g"."division_id")))
     LEFT JOIN "public"."datetime" ON (("datetime"."id" = "g"."datetime_id")))
     LEFT JOIN "public"."scores" "s" ON (("s"."game_id" = "g"."id")))
     LEFT JOIN "public"."teams" "t1" ON (("t1"."id" = "g"."team1_id")))
     LEFT JOIN "public"."teams" "t2" ON (("t2"."id" = "g"."team2_id")))
     LEFT JOIN "public"."fields" ON (("fields"."id" = "g"."field_id")))
     LEFT JOIN "public"."gametypes" ON (("gametypes"."id" = "g"."gametype_id")))
     LEFT JOIN "public"."rounds" ON (("rounds"."id" = "g"."round_id")))
  ORDER BY "g"."division_id", "g"."round_id";


ALTER TABLE "public"."full_gameview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rankings" (
    "team_id" integer NOT NULL,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "pool_rank" integer,
    "id" integer NOT NULL
);


ALTER TABLE "public"."rankings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."full_ranking" WITH ("security_invoker"='on') AS
 SELECT "t"."name",
    "t"."pool_id",
    "rankings"."team_id",
    "rankings"."wins",
    "rankings"."losses",
    "rankings"."pool_rank",
    "rankings"."id"
   FROM ("public"."rankings"
     JOIN "public"."teams" "t" ON (("t"."id" = "rankings"."team_id")))
  ORDER BY "t"."pool_id";


ALTER TABLE "public"."full_ranking" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."full_scores" WITH ("security_invoker"='on') AS
 SELECT "t1"."name" AS "team1_name",
    "t2"."name" AS "team2_name",
    "g"."pool_id",
    "s"."team1_score",
    "s"."team2_score",
    "s"."is_finished",
    "s"."id"
   FROM ((("public"."games" "g"
     JOIN "public"."scores" "s" ON (("s"."game_id" = "g"."id")))
     JOIN "public"."teams" "t1" ON (("t1"."id" = "g"."team1_id")))
     JOIN "public"."teams" "t2" ON (("t2"."id" = "g"."team2_id")))
  ORDER BY "g"."pool_id";


ALTER TABLE "public"."full_scores" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."games_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."games_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."games_id_seq" OWNED BY "public"."games"."id";



CREATE TABLE IF NOT EXISTS "public"."medical_requests" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "field_number" integer,
    "status" "public"."request_status" DEFAULT 'pending'::"public"."request_status",
    "trainer" "text",
    "priority_level" "text",
    "assigned_to" "uuid",
    "description_of_emergency" "text",
    "team_name" "text"
);


ALTER TABLE "public"."medical_requests" OWNER TO "postgres";


ALTER TABLE "public"."medical_requests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."medical_requests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notification_read_status" (
    "id" integer NOT NULL,
    "notification_id" integer,
    "user_id" "uuid",
    "read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_read_status" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notification_read_status_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."notification_read_status_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_read_status_id_seq" OWNED BY "public"."notification_read_status"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'announcement'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" smallint NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


ALTER TABLE "public"."permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."rankings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pool_standings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pools" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "division_id" integer
);


ALTER TABLE "public"."pools" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pools_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."pools_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pools_id_seq" OWNED BY "public"."pools"."id";



CREATE TABLE IF NOT EXISTS "public"."profile_roles" (
    "profile_id" "uuid" NOT NULL,
    "role_id" smallint NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profile_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "full_name" "text",
    "expo_push_token" "text",
    "is_logged_in" boolean DEFAULT false,
    "is_available" boolean DEFAULT false,
    "avatar_url" "text",
    "role_id" smallint NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rankings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."rankings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rankings_id_seq" OWNED BY "public"."rankings"."id";



CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "website" "text",
    "discount" "text",
    "category" "text"
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


ALTER TABLE "public"."restaurants" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."restaurants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" smallint NOT NULL,
    "permission_id" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" smallint NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "roles_key_check" CHECK (("key" = ANY (ARRAY['user'::"text", 'admin'::"text", 'medic'::"text", 'driver'::"text", 'volunteer'::"text"])))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."rounds_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."rounds_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rounds_id_seq" OWNED BY "public"."rounds"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."schedule_options_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."schedule_options_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schedule_options_id_seq" OWNED BY "public"."gametypes"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."scores_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."scores_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."scores_id_seq" OWNED BY "public"."scores"."id";



ALTER TABLE "public"."teams" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."teams_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."teams_new_id_seq1"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."teams_new_id_seq1" OWNER TO "postgres";


ALTER SEQUENCE "public"."teams_new_id_seq1" OWNED BY "public"."teams"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."teams_pool_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."teams_pool_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teams_pool_id_seq" OWNED BY "public"."teams"."pool_id";



CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" integer NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "website" "text",
    "type" "public"."vendor_type"
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."vendors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vendors_id_seq" OWNED BY "public"."vendors"."id";



CREATE TABLE IF NOT EXISTS "public"."volunteers" (
    "badge" "text",
    "role" "text",
    "id" smallint NOT NULL,
    "avatar_uri" "text"
);


ALTER TABLE "public"."volunteers" OWNER TO "postgres";


ALTER TABLE "public"."volunteers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."volunteers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."water_requests" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "field_number" integer,
    "status" "public"."request_status" DEFAULT 'pending'::"public"."request_status",
    "volunteer" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."water_requests" OWNER TO "postgres";


ALTER TABLE "public"."water_requests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."water_refill_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."anonymous_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."anonymous_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."divisions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."divisions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."favorite_teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."favorite_teams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fields" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fields_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."games" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."games_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."gametypes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schedule_options_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notification_read_status" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notification_read_status_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pools" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pools_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rounds" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rounds_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."scores" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."scores_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teams" ALTER COLUMN "pool_id" SET DEFAULT "nextval"('"public"."teams_pool_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vendors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vendors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."anonymous_tokens"
    ADD CONSTRAINT "anonymous_tokens_device_id_key" UNIQUE ("device_id");



ALTER TABLE ONLY "public"."anonymous_tokens"
    ADD CONSTRAINT "anonymous_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_requests"
    ADD CONSTRAINT "cart_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."datetime"
    ADD CONSTRAINT "datetime_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."datetime"
    ADD CONSTRAINT "datetime_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."divisions"
    ADD CONSTRAINT "divisions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."divisions"
    ADD CONSTRAINT "divisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq"
    ADD CONSTRAINT "faq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorite_teams"
    ADD CONSTRAINT "favorite_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorite_teams"
    ADD CONSTRAINT "favorite_teams_user_id_team_id_key" UNIQUE ("user_id", "team_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fields"
    ADD CONSTRAINT "fields_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."fields"
    ADD CONSTRAINT "fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_requests"
    ADD CONSTRAINT "medical_requests_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."medical_requests"
    ADD CONSTRAINT "medical_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_read_status"
    ADD CONSTRAINT "notification_read_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rankings"
    ADD CONSTRAINT "pool_standings_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."rankings"
    ADD CONSTRAINT "pool_standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pools"
    ADD CONSTRAINT "pools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_roles"
    ADD CONSTRAINT "profile_roles_pkey" PRIMARY KEY ("profile_id", "role_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gametypes"
    ADD CONSTRAINT "schedule_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rankings"
    ADD CONSTRAINT "unique_team_id" UNIQUE ("team_id");



ALTER TABLE ONLY "public"."notification_read_status"
    ADD CONSTRAINT "unique_user_notification" UNIQUE ("user_id", "notification_id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."volunteers"
    ADD CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."water_requests"
    ADD CONSTRAINT "water_refill_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_cart_requests_driver_status_created_at" ON "public"."cart_requests" USING "btree" ("driver", "status", "created_at");



CREATE INDEX "idx_cart_requests_requester_id" ON "public"."cart_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_cart_requests_status_created_at" ON "public"."cart_requests" USING "btree" ("status", "created_at");



CREATE INDEX "idx_games_division_gametype_round" ON "public"."games" USING "btree" ("division_id", "gametype_id", "round_id");



CREATE INDEX "idx_games_division_round_datetime" ON "public"."games" USING "btree" ("division_id", "round_id", "datetime_id");



CREATE INDEX "idx_medical_requests_status_created_at" ON "public"."medical_requests" USING "btree" ("status", "created_at");



CREATE INDEX "idx_medical_requests_status_updated_at" ON "public"."medical_requests" USING "btree" ("status", "updated_at");



CREATE INDEX "idx_notifications_user_id_created_at" ON "public"."notifications" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "idx_scores_game_id_unique" ON "public"."scores" USING "btree" ("game_id");



CREATE INDEX "idx_water_requests_status_created_at" ON "public"."water_requests" USING "btree" ("status", "created_at");



CREATE INDEX "idx_water_requests_status_updated_at" ON "public"."water_requests" USING "btree" ("status", "updated_at");



CREATE UNIQUE INDEX "profile_roles_one_primary_idx" ON "public"."profile_roles" USING "btree" ("profile_id") WHERE "is_primary";



CREATE INDEX "profiles_role_id_idx" ON "public"."profiles" USING "btree" ("role_id");



CREATE UNIQUE INDEX "roles_single_default_idx" ON "public"."roles" USING "btree" ("is_default") WHERE "is_default";



CREATE OR REPLACE TRIGGER "insert_rankings_after_score_insert" AFTER INSERT ON "public"."scores" FOR EACH ROW EXECUTE FUNCTION "public"."insert_new_rankings"();



CREATE OR REPLACE TRIGGER "insert_score_after_game_insert" AFTER INSERT ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."insert_new_score"();



CREATE OR REPLACE TRIGGER "trg_cart_accepted_notifications" AFTER UPDATE ON "public"."cart_requests" FOR EACH ROW WHEN ((("old"."status" = 'pending'::"public"."request_status") AND ("new"."status" = 'confirmed'::"public"."request_status"))) EXECUTE FUNCTION "supabase_functions"."http_request"('https://opleqymigooimduhlvym.supabase.co/functions/v1/cart-request', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbGVxeW1pZ29vaW1kdWhsdnltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTQ5ODE0MCwiZXhwIjoyMDM1MDc0MTQwfQ.bCMKqxcqFgLXYJro0uq5a6W4hR7wVJIJ8FmZ8yJE7Pw"}', '{}', '1000');



CREATE OR REPLACE TRIGGER "trg_cart_notifications" AFTER INSERT ON "public"."cart_requests" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://opleqymigooimduhlvym.supabase.co/functions/v1/cart-request', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbGVxeW1pZ29vaW1kdWhsdnltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTQ5ODE0MCwiZXhwIjoyMDM1MDc0MTQwfQ.bCMKqxcqFgLXYJro0uq5a6W4hR7wVJIJ8FmZ8yJE7Pw"}', '{}', '1000');



CREATE OR REPLACE TRIGGER "trg_medic_notifications" AFTER INSERT OR UPDATE ON "public"."medical_requests" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://opleqymigooimduhlvym.supabase.co/functions/v1/trainer-request', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbGVxeW1pZ29vaW1kdWhsdnltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTQ5ODE0MCwiZXhwIjoyMDM1MDc0MTQwfQ.bCMKqxcqFgLXYJro0uq5a6W4hR7wVJIJ8FmZ8yJE7Pw"}', '{}', '1000');



CREATE OR REPLACE TRIGGER "trg_profiles_default_role" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_profile_role_default"();



CREATE OR REPLACE TRIGGER "trg_profiles_sync_primary_profile_role" AFTER INSERT OR UPDATE OF "role_id" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_roles_primary_from_profile"();



CREATE OR REPLACE TRIGGER "trg_update_rankings" AFTER UPDATE ON "public"."scores" FOR EACH ROW WHEN ((("new"."is_finished" = true) AND ("old"."is_finished" = false))) EXECUTE FUNCTION "public"."perform_rankings_and_tiebreakers"();



CREATE OR REPLACE TRIGGER "trg_water_requests" AFTER INSERT OR DELETE ON "public"."water_requests" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://opleqymigooimduhlvym.supabase.co/functions/v1/water-request', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbGVxeW1pZ29vaW1kdWhsdnltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTQ5ODE0MCwiZXhwIjoyMDM1MDc0MTQwfQ.bCMKqxcqFgLXYJro0uq5a6W4hR7wVJIJ8FmZ8yJE7Pw"}', '{}', '1000');



ALTER TABLE ONLY "public"."cart_requests"
    ADD CONSTRAINT "cart_requests_anon_device_id_fkey" FOREIGN KEY ("anon_device_id") REFERENCES "public"."anonymous_tokens"("device_id");



ALTER TABLE ONLY "public"."cart_requests"
    ADD CONSTRAINT "cart_requests_driver_fkey" FOREIGN KEY ("driver") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."cart_requests"
    ADD CONSTRAINT "cart_requests_from_field_number_fkey" FOREIGN KEY ("from_field_number") REFERENCES "public"."fields"("id");



ALTER TABLE ONLY "public"."cart_requests"
    ADD CONSTRAINT "cart_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."cart_requests"
    ADD CONSTRAINT "cart_requests_to_field_number_fkey" FOREIGN KEY ("to_field_number") REFERENCES "public"."fields"("id");



ALTER TABLE ONLY "public"."favorite_teams"
    ADD CONSTRAINT "favorite_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorite_teams"
    ADD CONSTRAINT "favorite_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "fk_pool" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_datetime_id_fkey" FOREIGN KEY ("datetime_id") REFERENCES "public"."datetime"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_gametype_id_fkey" FOREIGN KEY ("gametype_id") REFERENCES "public"."gametypes"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."gametypes"
    ADD CONSTRAINT "gametypes_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id");



ALTER TABLE ONLY "public"."medical_requests"
    ADD CONSTRAINT "medical_requests_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."medical_requests"
    ADD CONSTRAINT "medical_requests_field_number_fkey" FOREIGN KEY ("field_number") REFERENCES "public"."fields"("id");



ALTER TABLE ONLY "public"."notification_read_status"
    ADD CONSTRAINT "notification_read_status_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_read_status"
    ADD CONSTRAINT "notification_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pools"
    ADD CONSTRAINT "pools_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id");



ALTER TABLE ONLY "public"."profile_roles"
    ADD CONSTRAINT "profile_roles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_roles"
    ADD CONSTRAINT "profile_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rankings"
    ADD CONSTRAINT "rankings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id");



ALTER TABLE ONLY "public"."water_requests"
    ADD CONSTRAINT "water_refill_field_number_fkey" FOREIGN KEY ("field_number") REFERENCES "public"."fields"("id");



CREATE POLICY "Admins can insert to notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profile_roles" "pr"
     JOIN "public"."roles" "r" ON (("r"."id" = "pr"."role_id")))
  WHERE (("pr"."profile_id" = "auth"."uid"()) AND ("r"."key" = 'admin'::"text")))));



CREATE POLICY "Admins can read feedback" ON "public"."feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role_id" = 2)))));



CREATE POLICY "All administrative users can insert to games" ON "public"."games" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT COALESCE(("profiles"."role_id")::integer, 0) AS "coalesce"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))) <> 1)));



CREATE POLICY "All administrative users can update on datetime" ON "public"."datetime" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT COALESCE(("profiles"."role_id")::integer, 0) AS "coalesce"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))) <> 1)));



CREATE POLICY "All administrative users can update rankings" ON "public"."rankings" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT COALESCE(("profiles"."role_id")::integer, 0) AS "coalesce"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))) <> 1)));



CREATE POLICY "Anyone can delete on anonymous_tokens" ON "public"."anonymous_tokens" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can insert to anonymous_tokens" ON "public"."anonymous_tokens" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert to cart_requests" ON "public"."cart_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert to feedback" ON "public"."feedback" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert to medical_requests" ON "public"."medical_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert to water_requests" ON "public"."water_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can read cart_requests" ON "public"."cart_requests" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read datetime" ON "public"."datetime" FOR SELECT USING (true);



CREATE POLICY "Anyone can read divisions" ON "public"."divisions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read faqs" ON "public"."faq" FOR SELECT USING (true);



CREATE POLICY "Anyone can read fields" ON "public"."fields" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read games" ON "public"."games" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read gametypes" ON "public"."gametypes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read medical_requests" ON "public"."medical_requests" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read notification_read_status" ON "public"."notification_read_status" FOR SELECT TO "authenticated", "anon" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Anyone can read notifications" ON "public"."notifications" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read permissions" ON "public"."permissions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read pools" ON "public"."pools" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read profile_roles" ON "public"."profile_roles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read profiles" ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read rankings" ON "public"."rankings" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read restaurants" ON "public"."restaurants" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read role permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read roles" ON "public"."roles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read rounds" ON "public"."rounds" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read scores" ON "public"."scores" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read teams" ON "public"."teams" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read vendors" ON "public"."vendors" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read volunteers" ON "public"."volunteers" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read water_requests" ON "public"."water_requests" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can update on anonymous_tokens" ON "public"."anonymous_tokens" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can update on notifications" ON "public"."notifications" FOR UPDATE TO "authenticated", "anon" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can delete on favorite_teams" ON "public"."favorite_teams" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can delete on profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Authenticated users can insert to favorite_teams" ON "public"."favorite_teams" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert to notification_read_status" ON "public"."notification_read_status" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert to profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read favorite_teams" ON "public"."favorite_teams" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can update on fields" ON "public"."fields" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update on games" ON "public"."games" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update on profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update scores" ON "public"."scores" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Drivers and admins can delete on cart_requests" ON "public"."cart_requests" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_roles" "pr"
  WHERE (("pr"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("pr"."role_id" = ANY (ARRAY[2, 4])))))));



CREATE POLICY "Drivers and admins can update on cart_requests" ON "public"."cart_requests" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_roles" "pr"
  WHERE (("pr"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("pr"."role_id" = ANY (ARRAY[2, 4])))))));



CREATE POLICY "Trainers and admins can delete on medical_requests" ON "public"."medical_requests" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_roles" "pr"
  WHERE (("pr"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("pr"."role_id" = ANY (ARRAY[2, 3])))))));



CREATE POLICY "Trainers and admins can update on medical_requests" ON "public"."medical_requests" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_roles" "pr"
  WHERE (("pr"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("pr"."role_id" = ANY (ARRAY[2, 3])))))));



CREATE POLICY "Volunteers and admins can delete on water_requests" ON "public"."water_requests" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_roles" "pr"
  WHERE (("pr"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("pr"."role_id" = ANY (ARRAY[2, 5])))))));



CREATE POLICY "Volunteers and admins can update on water_requests" ON "public"."water_requests" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profile_roles" "pr"
  WHERE (("pr"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("pr"."role_id" = ANY (ARRAY[2, 5])))))));



ALTER TABLE "public"."anonymous_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."datetime" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."divisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorite_teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gametypes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_read_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."volunteers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."water_requests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."cart_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."games";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."medical_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rankings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."scores";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";













































































































































































































































GRANT ALL ON FUNCTION "public"."calculate_tiebreakers"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_tiebreakers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_tiebreakers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_favorites_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_favorites_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_favorites_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."client_update_rankings_and_tiebreakers"() TO "anon";
GRANT ALL ON FUNCTION "public"."client_update_rankings_and_tiebreakers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."client_update_rankings_and_tiebreakers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_profile_role_default"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_profile_role_default"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_profile_role_default"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_default_role_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_default_role_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_default_role_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_access"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_access"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_access"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_anonymous_token"("p_device_id" "text", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_anonymous_token"("p_device_id" "text", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_anonymous_token"("p_device_id" "text", "p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_new_rankings"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_new_rankings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_new_rankings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_new_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_new_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_new_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."perform_rankings_and_tiebreakers"() TO "anon";
GRANT ALL ON FUNCTION "public"."perform_rankings_and_tiebreakers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_rankings_and_tiebreakers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_bracket_scores"("round_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reset_bracket_scores"("round_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_bracket_scores"("round_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_pool_scores"("pool_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reset_pool_scores"("pool_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_pool_scores"("pool_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_roles_primary_from_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_roles_primary_from_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_roles_primary_from_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pool_rankings"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pool_rankings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pool_rankings"() TO "service_role";


















GRANT ALL ON TABLE "public"."anonymous_tokens" TO "anon";
GRANT ALL ON TABLE "public"."anonymous_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."anonymous_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."anonymous_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."anonymous_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."anonymous_tokens_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cart_requests" TO "anon";
GRANT ALL ON TABLE "public"."cart_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cart_requests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cart_requests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cart_requests_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."datetime_id_seq_new" TO "anon";
GRANT ALL ON SEQUENCE "public"."datetime_id_seq_new" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."datetime_id_seq_new" TO "service_role";



GRANT ALL ON TABLE "public"."datetime" TO "anon";
GRANT ALL ON TABLE "public"."datetime" TO "authenticated";
GRANT ALL ON TABLE "public"."datetime" TO "service_role";



GRANT ALL ON TABLE "public"."divisions" TO "anon";
GRANT ALL ON TABLE "public"."divisions" TO "authenticated";
GRANT ALL ON TABLE "public"."divisions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."divisions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."divisions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."divisions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."faq" TO "anon";
GRANT ALL ON TABLE "public"."faq" TO "authenticated";
GRANT ALL ON TABLE "public"."faq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."faq_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."faq_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."faq_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."favorite_teams" TO "anon";
GRANT ALL ON TABLE "public"."favorite_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."favorite_teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."favorite_teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."favorite_teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."favorite_teams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON SEQUENCE "public"."feedback_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."feedback_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."feedback_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fields" TO "anon";
GRANT ALL ON TABLE "public"."fields" TO "authenticated";
GRANT ALL ON TABLE "public"."fields" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fields_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fields_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fields_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."gametypes" TO "anon";
GRANT ALL ON TABLE "public"."gametypes" TO "authenticated";
GRANT ALL ON TABLE "public"."gametypes" TO "service_role";



GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";



GRANT ALL ON TABLE "public"."scores" TO "anon";
GRANT ALL ON TABLE "public"."scores" TO "authenticated";
GRANT ALL ON TABLE "public"."scores" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."full_gameview" TO "anon";
GRANT ALL ON TABLE "public"."full_gameview" TO "authenticated";
GRANT ALL ON TABLE "public"."full_gameview" TO "service_role";



GRANT ALL ON TABLE "public"."rankings" TO "anon";
GRANT ALL ON TABLE "public"."rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."rankings" TO "service_role";



GRANT ALL ON TABLE "public"."full_ranking" TO "anon";
GRANT ALL ON TABLE "public"."full_ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."full_ranking" TO "service_role";



GRANT ALL ON TABLE "public"."full_scores" TO "anon";
GRANT ALL ON TABLE "public"."full_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."full_scores" TO "service_role";



GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."medical_requests" TO "anon";
GRANT ALL ON TABLE "public"."medical_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."medical_requests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."medical_requests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."medical_requests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_read_status" TO "anon";
GRANT ALL ON TABLE "public"."notification_read_status" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_read_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_read_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_read_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_read_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pool_standings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pool_standings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pool_standings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pools" TO "anon";
GRANT ALL ON TABLE "public"."pools" TO "authenticated";
GRANT ALL ON TABLE "public"."pools" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pools_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pools_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pools_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile_roles" TO "anon";
GRANT ALL ON TABLE "public"."profile_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_roles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rankings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rankings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rankings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schedule_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedule_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedule_options_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."scores_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."scores_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scores_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_new_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_new_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_new_id_seq1" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_pool_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_pool_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_pool_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."volunteers" TO "anon";
GRANT ALL ON TABLE "public"."volunteers" TO "authenticated";
GRANT ALL ON TABLE "public"."volunteers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."volunteers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."volunteers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."volunteers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."water_requests" TO "anon";
GRANT ALL ON TABLE "public"."water_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."water_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."water_refill_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."water_refill_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."water_refill_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
