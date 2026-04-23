alter table "public"."scores" add column "round_id" smallint;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_new_score()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  INSERT INTO scores (game_id, team1_score, team2_score, is_finished, round_id)
  VALUES (NEW.id, 0, 0, false, NEW.round_id);
  
  RETURN NEW;
END;$function$
;


