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

    const body = await req.json()
    const { gameId, result_phase_ms = 3000, leaderboard_ms = 4000 } = body

    if (!gameId) {
      return new Response(JSON.stringify({ error: 'gameId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: game, error: gameErr } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameErr || !game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (game.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: 'Game not in progress' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Read game_settings for question time
    const { data: settings } = await supabase
      .from('game_settings')
      .select('question_time_seconds, questions_per_game')
      .eq('game_id', gameId)
      .maybeSingle()

    const questionTimeSec = settings?.question_time_seconds ?? 15
    const questionTimeMs = body.question_time_ms ?? questionTimeSec * 1000

    // Get actual question count from game_questions table
    const { count: actualTotal } = await supabase
      .from('game_questions')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    const totalQuestions = actualTotal ?? game.total_questions ?? 10

    const currentPhase = game.phase
    const currentIdx = game.current_question_index ?? 0
    const now = new Date().toISOString()

    console.log('advance-phase:', { currentPhase, currentIdx, totalQuestions, actualTotal, questionTimeMs, settings })

    let nextPhase: string
    let nextIdx = currentIdx

    if (currentPhase === 'question_active') {
      nextPhase = 'result_phase'
    } else if (currentPhase === 'result_phase' || currentPhase === 'leaderboard') {
      // Skip leaderboard phase — go directly to next question or finish
      const nextIndex = currentIdx + 1
      if (nextIndex >= totalQuestions) {
        // Game finished — two updates to ensure realtime triggers
        await supabase
          .from('games')
          .update({
            status: 'finished',
            finished_at: now,
          })
          .eq('id', gameId)

        // Small delay then update phase separately for a second realtime event
        await new Promise(resolve => setTimeout(resolve, 100))

        await supabase
          .from('games')
          .update({
            phase: 'finished',
          })
          .eq('id', gameId)

        console.log('Game finished - two updates sent:', gameId)
        return new Response(JSON.stringify({ phase: 'finished', status: 'finished', question_index: currentIdx }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        nextPhase = 'question_active'
        nextIdx = nextIndex
      }
    } else {
      // Initial phase — start with question_active
      nextPhase = 'question_active'
    }

    await supabase
      .from('games')
      .update({
        phase: nextPhase,
        phase_started_at: now,
        current_question_index: nextIdx,
      })
      .eq('id', gameId)

    return new Response(JSON.stringify({ phase: nextPhase, question_index: nextIdx }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('advance-phase error:', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
