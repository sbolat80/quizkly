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

    if (typeof gameId !== 'string' || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify caller is the host of this game
    const { data: game, error: gameErr } = await supabase
      .from('games')
      .select('id, host_player_id')
      .eq('id', gameId)
      .maybeSingle()
    if (gameErr || !game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: hostPlayer } = await supabase
      .from('players')
      .select('id, session_id')
      .eq('id', game.host_player_id)
      .maybeSingle()

    if (!hostPlayer || hostPlayer.session_id !== sessionId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('answers').delete().eq('game_id', gameId)
    await supabase.from('game_questions').delete().eq('game_id', gameId)
    await supabase.from('players').update({ score: 0 }).eq('game_id', gameId)
    await supabase
      .from('games')
      .update({
        status: 'waiting',
        phase: null,
        phase_started_at: null,
        current_question_index: 0,
        started_at: null,
        finished_at: null,
      })
      .eq('id', gameId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const ref = crypto.randomUUID()
    console.error(`[${ref}] reset-game error:`, e)
    return new Response(JSON.stringify({ error: 'Internal server error', ref }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
