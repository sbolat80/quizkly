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

    const { gameId, questionId, playerId, sessionId, submittedAnswer, responseTimeMs } = await req.json()

    if (!gameId || !questionId || !playerId || !sessionId || submittedAnswer == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof submittedAnswer !== 'string' || submittedAnswer.length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid answer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify session matches the player's recorded session and player belongs to game
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('id, session_id, game_id')
      .eq('id', playerId)
      .maybeSingle()

    if (playerErr || !player || player.session_id !== sessionId || player.game_id !== gameId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use the DB-fetched id from this point forward
    const verifiedPlayerId = player.id

    // Check for duplicate answer
    const { data: existing } = await supabase
      .from('answers')
      .select('id')
      .eq('game_id', gameId)
      .eq('question_id', questionId)
      .eq('player_id', verifiedPlayerId)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already answered', is_correct: false, points_awarded: 0, correct_index: -1 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get question
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('correct_answer, options')
      .eq('id', questionId)
      .single()

    if (qErr || !question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options as string)
    const correctAnswer = question.correct_answer
    const isCorrect = submittedAnswer === correctAnswer
    const correctIndex = options.indexOf(correctAnswer)

    // Read question_time_seconds from game_settings
    const { data: settings } = await supabase
      .from('game_settings')
      .select('question_time_seconds')
      .eq('game_id', gameId)
      .maybeSingle()

    const questionTimeSeconds = settings?.question_time_seconds ?? 15
    const questionTimeMs = questionTimeSeconds * 1000

    let pointsAwarded = 0
    if (isCorrect) {
      const timeFactor = Math.max(0, 1 - (responseTimeMs || 0) / questionTimeMs)
      pointsAwarded = Math.round(500 + 500 * timeFactor)
    }

    await supabase.from('answers').insert({
      game_id: gameId,
      question_id: questionId,
      player_id: verifiedPlayerId,
      session_id: sessionId,
      submitted_answer: submittedAnswer,
      response_time_ms: responseTimeMs ?? 0,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    })

    if (pointsAwarded > 0) {
      await supabase.rpc('increment_player_score', {
        p_player_id: verifiedPlayerId,
        p_points: pointsAwarded,
      })
    }

    return new Response(JSON.stringify({
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      correct_index: correctIndex,
      question_time_seconds: questionTimeSeconds,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    const ref = crypto.randomUUID()
    console.error(`[${ref}] submit-answer error:`, e)
    return new Response(JSON.stringify({ error: 'Internal server error', ref }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
