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

    const { sessionId, code, nickname, avatarId } = await req.json()

    if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 64) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (typeof code !== 'string' || code.trim().length < 3 || code.length > 10) {
      return new Response(JSON.stringify({ error: 'Invalid game code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (typeof nickname !== 'string' || nickname.trim().length === 0 || nickname.length > 20) {
      return new Response(JSON.stringify({ error: 'Invalid nickname' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (typeof avatarId !== 'number' || !Number.isInteger(avatarId) || avatarId < 1 || avatarId > 100) {
      return new Response(JSON.stringify({ error: 'Invalid avatar' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: game, error: gameErr } = await supabase
      .from('games')
      .select()
      .eq('game_code', code.toUpperCase())
      .maybeSingle()

    if (gameErr || !game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (game.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game already started' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: existingPlayers } = await supabase
      .from('players')
      .select('id, session_id, nickname, avatar_id, is_host, score, game_id, joined_at, is_active')
      .eq('game_id', game.id)
      .eq('is_active', true)

    if ((existingPlayers?.length ?? 0) >= 8) {
      return new Response(JSON.stringify({ error: 'Game is full' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const existing = existingPlayers?.find((p) => p.session_id === sessionId)
    if (existing) {
      return new Response(JSON.stringify({ game, player: existing }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        session_id: sessionId,
        nickname: nickname.trim(),
        avatar_id: avatarId,
        is_host: false,
      })
      .select()
      .single()
    if (playerErr || !player) throw new Error('Player insert failed')

    return new Response(JSON.stringify({ game, player }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const ref = crypto.randomUUID()
    console.error(`[${ref}] join-game error:`, e)
    return new Response(JSON.stringify({ error: 'Internal server error', ref }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
