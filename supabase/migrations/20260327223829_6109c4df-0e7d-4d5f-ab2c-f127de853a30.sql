
-- Remove public read access to questions (correct_answer must never be exposed)
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;

-- Remove public delete on game_questions
DROP POLICY IF EXISTS "Anyone can delete game_questions" ON public.game_questions;
