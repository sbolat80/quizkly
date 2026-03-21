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
    const { gameId, question_time_ms = 15000, result_phase_ms = 3000, leaderboard_ms = 4000 } = body

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

    const currentPhase = game.phase
    const currentIdx = game.current_question_index ?? 0
    const totalQuestions = game.total_questions ?? 10
    const now = new Date().toISOString()

    let nextPhase: string
    let nextIdx = currentIdx
    let finished = false

    if (currentPhase === 'question_active') {
      nextPhase = 'result_phase'
    } else if (currentPhase === 'result_phase') {
      nextPhase = 'leaderboard'
    } else if (currentPhase === 'leaderboard') {
      if (currentIdx + 1 >= totalQuestions) {
        finished = true
        nextPhase = 'finished'
      } else {
        nextPhase = 'question_active'
        nextIdx = currentIdx + 1
      }
    } else {
      // Initial phase or unknown — start with question_active
      nextPhase = 'question_active'
    }

    if (finished) {
      await supabase
        .from('games')
        .update({
          status: 'finished',
          phase: 'finished',
          finished_at: now,
        })
        .eq('id', gameId)

      return new Response(JSON.stringify({ phase: 'finished', question_index: currentIdx }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
