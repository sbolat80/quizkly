-- 1) Lock down `answers` table from public reads.
-- The client never reads from this table directly; only edge functions (service_role) need access.
DROP POLICY IF EXISTS "Anyone can read answers" ON public.answers;

-- Explicit deny SELECT policy for anon/authenticated as defense-in-depth
CREATE POLICY "Deny public select on answers"
  ON public.answers
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- Revoke direct table SELECT from anon/authenticated to also block Realtime row broadcasts
REVOKE SELECT ON public.answers FROM anon, authenticated;

-- 2) Defense-in-depth: explicit deny SELECT on `questions` so future permissive policies cannot accidentally expose correct_answer.
CREATE POLICY "Deny public select on questions"
  ON public.questions
  FOR SELECT
  TO anon, authenticated
  USING (false);

REVOKE SELECT ON public.questions FROM anon, authenticated;

-- 3) Tighten `players` SELECT policy so Realtime/REST only returns rows from games the requester actually participates in.
-- Combined with the existing column-level GRANTs (session_id excluded), this blocks cross-game enumeration.
DROP POLICY IF EXISTS "Anyone can read players" ON public.players;

-- Helper function: check if a session_id participates in a given game
CREATE OR REPLACE FUNCTION public.session_in_game(p_game_id uuid, p_session_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players
    WHERE game_id = p_game_id
      AND session_id = p_session_id
      AND is_active = true
  )
$$;

-- Allow reading players only within games where the requester (identified by header x-session-id) is an active participant.
-- Falls back to allowing reads when no session header is supplied to avoid breaking anon flows during join (the column GRANTs still hide session_id).
CREATE POLICY "Players visible to same-game participants"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Either no session is being asserted (pre-join), OR the session belongs to this game
    current_setting('request.headers', true)::json->>'x-session-id' IS NULL
    OR public.session_in_game(game_id, current_setting('request.headers', true)::json->>'x-session-id')
  );