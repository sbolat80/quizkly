import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { gameId, sessionId } = await req.json()

    if (!gameId || !sessionId) {
      return new Response(JSON.stringify({ error: 'Missing gameId or sessionId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the session belongs to an active player in this game
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', gameId)
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .maybeSingle()

    if (playerErr || !player) {
      return new Response(JSON.stringify({ error: 'Not a player in this game' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch game_questions joined with questions, excluding correct_answer and explanation
    const { data: gameQuestions, error: gqErr } = await supabase
      .from('game_questions')
      .select('id, game_id, question_id, question_order, questions(id, question_text, options, category, difficulty, language, type)')
      .eq('game_id', gameId)
      .order('question_order', { ascending: true })

    if (gqErr) {
      console.error('Failed to fetch game questions:', gqErr)
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(gameQuestions ?? []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('get-game-questions error:', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
