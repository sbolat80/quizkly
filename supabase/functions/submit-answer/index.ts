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

    // Check for duplicate answer
    const { data: existing } = await supabase
      .from('answers')
      .select('id')
      .eq('game_id', gameId)
      .eq('question_id', questionId)
      .eq('player_id', playerId)
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

    // Calculate points: base 1000, minus time penalty proportional to actual question duration
    let pointsAwarded = 0
    if (isCorrect) {
      const timeFactor = Math.max(0, 1 - (responseTimeMs || 0) / questionTimeMs)
      pointsAwarded = Math.round(500 + 500 * timeFactor)
    }

    // Insert answer
    await supabase.from('answers').insert({
      game_id: gameId,
      question_id: questionId,
      player_id: playerId,
      session_id: sessionId,
      submitted_answer: submittedAnswer,
      response_time_ms: responseTimeMs ?? 0,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    })

    // Update player score
    if (pointsAwarded > 0) {
      await supabase.rpc('increment_player_score', {
        p_player_id: playerId,
        p_points: pointsAwarded,
      })
    }

    return new Response(JSON.stringify({
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      correct_index: correctIndex,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('submit-answer error:', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
