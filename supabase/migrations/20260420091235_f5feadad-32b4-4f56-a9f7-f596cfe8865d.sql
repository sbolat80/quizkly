
-- Drop overly permissive policies on players
DROP POLICY IF EXISTS "Anyone can create players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;

-- Drop overly permissive policies on games
DROP POLICY IF EXISTS "Anyone can create games" ON public.games;
DROP POLICY IF EXISTS "Anyone can update games" ON public.games;
DROP POLICY IF EXISTS "Anyone can delete games" ON public.games;

-- Drop overly permissive policies on answers
DROP POLICY IF EXISTS "Anyone can create answers" ON public.answers;
DROP POLICY IF EXISTS "Anyone can delete answers" ON public.answers;

-- Drop overly permissive policies on game_questions
DROP POLICY IF EXISTS "Anyone can create game_questions" ON public.game_questions;

-- Drop overly permissive policies on game_settings
DROP POLICY IF EXISTS "Anyone can create game_settings" ON public.game_settings;
DROP POLICY IF EXISTS "Anyone can delete game_settings" ON public.game_settings;

-- Read policies remain (needed for realtime subscriptions and gameplay reads).
-- Service role policies remain (edge functions perform all writes).

-- Fix linter: set fixed search_path on assign_game_questions
CREATE OR REPLACE FUNCTION public.assign_game_questions(p_game_id uuid, p_language text DEFAULT 'en'::text, p_question_count integer DEFAULT 10)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  v_question_ids UUID[];
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.questions
    WHERE is_active = true
      AND language = p_language
    ORDER BY 
      times_played ASC,
      last_played_at ASC NULLS FIRST,
      random()
    LIMIT p_question_count
  ) INTO v_question_ids;

  INSERT INTO public.game_questions (game_id, question_id, question_order)
  SELECT 
    p_game_id,
    unnest(v_question_ids),
    generate_series(1, array_length(v_question_ids, 1));

  UPDATE public.questions
  SET 
    times_played = times_played + 1,
    last_played_at = now()
  WHERE id = ANY(v_question_ids);
END;
$function$;

-- Also harden the other public functions with fixed search_path
CREATE OR REPLACE FUNCTION public.generate_game_code(code_length integer DEFAULT 6)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(
      chars,
      floor(random() * length(chars) + 1)::INT,
      1
    );
  END LOOP;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_player_score(p_player_id uuid, p_points integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.players
  SET score = score + p_points
  WHERE id = p_player_id;
END;
$function$;
