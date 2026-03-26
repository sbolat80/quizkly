
-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Games: anyone can read/insert/update
CREATE POLICY "Anyone can read games" ON public.games FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create games" ON public.games FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON public.games FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete games" ON public.games FOR DELETE TO anon, authenticated USING (true);

-- Players: anyone can read/insert/update
CREATE POLICY "Anyone can read players" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create players" ON public.players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete players" ON public.players FOR DELETE TO anon, authenticated USING (true);

-- Answers: anyone can read/insert/delete
CREATE POLICY "Anyone can read answers" ON public.answers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create answers" ON public.answers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete answers" ON public.answers FOR DELETE TO anon, authenticated USING (true);

-- Game questions: anyone can read/insert/delete
CREATE POLICY "Anyone can read game_questions" ON public.game_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create game_questions" ON public.game_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete game_questions" ON public.game_questions FOR DELETE TO anon, authenticated USING (true);

-- Game settings: anyone can read/insert
CREATE POLICY "Anyone can read game_settings" ON public.game_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create game_settings" ON public.game_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete game_settings" ON public.game_settings FOR DELETE TO anon, authenticated USING (true);

-- Questions: read-only for players
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT TO anon, authenticated USING (true);

-- Also grant service_role full access (for edge functions)
CREATE POLICY "Service role full access games" ON public.games FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access players" ON public.players FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access answers" ON public.answers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access game_questions" ON public.game_questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access game_settings" ON public.game_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access questions" ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);
