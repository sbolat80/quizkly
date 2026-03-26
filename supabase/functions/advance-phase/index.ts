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
    const { gameId, expected_phase, expected_phase_started_at } = body

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

    // Idempotency check: if caller specifies expected_phase and/or expected_phase_started_at,
    // verify the game is still in that state. If not, another client already advanced it.
    if (expected_phase && game.phase !== expected_phase) {
      console.log('Already advanced. Expected:', expected_phase, 'Current:', game.phase)
      return new Response(JSON.stringify({
        already_advanced: true,
        phase: game.phase,
        question_index: game.current_question_index,
        status: game.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (expected_phase_started_at && game.phase_started_at !== expected_phase_started_at) {
      console.log('Phase started_at mismatch. Expected:', expected_phase_started_at, 'Current:', game.phase_started_at)
      return new Response(JSON.stringify({
        already_advanced: true,
        phase: game.phase,
        question_index: game.current_question_index,
        status: game.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (game.status === 'finished') {
      return new Response(JSON.stringify({
        already_advanced: true,
        phase: 'finished',
        question_index: game.current_question_index,
        status: 'finished',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (game.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: 'Game not in progress' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get actual question count from game_questions table
    const { count: actualTotal } = await supabase
      .from('game_questions')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    const totalQuestions = actualTotal ?? game.total_questions ?? 10

    const currentPhase = game.phase
    const currentIdx = game.current_question_index ?? 0
    const now = new Date().toISOString()

    console.log('advance-phase:', { currentPhase, currentIdx, totalQuestions, actualTotal })

    let nextPhase: string
    let nextIdx = currentIdx

    if (currentPhase === 'question_active') {
      nextPhase = 'result_phase'
    } else if (currentPhase === 'result_phase') {
      const isLastQuestion = currentIdx + 1 >= totalQuestions

      if (isLastQuestion) {
        // Final question: finish immediately after result screen
        await supabase
          .from('games')
          .update({
            status: 'finished',
            finished_at: now,
          })
          .eq('id', gameId)

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
      }

      nextPhase = 'leaderboard'
    } else if (currentPhase === 'leaderboard') {
      nextPhase = 'question_active'
      nextIdx = currentIdx + 1
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
