-- 1) Restrict public read on players: revoke session_id column from anon/authenticated.
--    Public SELECT policy still allows reading other safe columns (id, nickname, avatar, score, etc.).
REVOKE SELECT ON public.players FROM anon, authenticated;
GRANT SELECT (id, game_id, nickname, avatar_id, score, is_host, is_active, joined_at)
  ON public.players TO anon, authenticated;

-- 2) Lock down realtime broadcast/presence: deny all access to realtime.messages
--    (postgres_changes still respects table-level RLS and continue to work).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all realtime broadcast/presence" ON realtime.messages;
CREATE POLICY "Deny all realtime broadcast/presence"
  ON realtime.messages
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
