import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCategoryDistribution(categories: string[], needed: number): Record<string, number> {
  const shuffled = shuffle(categories)
  const dist: Record<string, number> = {}
  for (const cat of shuffled) dist[cat] = 0
  let remaining = needed
  let idx = 0
  while (remaining > 0) {
    dist[shuffled[idx % shuffled.length]]++
    remaining--
    idx++
  }
  return dist
}

// Pick N distinct categories from the pool, prioritizing least-played categories.
// If pool has fewer than N distinct categories, returns all available (caller round-robins).
async function pickCategoriesForGame(
  supabase: ReturnType<typeof createClient>,
  language: string,
  needed: number,
): Promise<string[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('category, times_played, last_played_at')
    .eq('is_active', true)
    .eq('language', language)

  if (error || !questions || questions.length === 0) return []

  // Aggregate per-category stats: total times_played and most recent last_played_at
  const stats = new Map<string, { totalPlayed: number; lastPlayed: number; count: number }>()
  for (const q of questions) {
    const cat = q.category as string
    const tp = (q.times_played as number | null) ?? 0
    const lp = q.last_played_at ? new Date(q.last_played_at as string).getTime() : -Infinity
    const cur = stats.get(cat)
    if (!cur) {
      stats.set(cat, { totalPlayed: tp, lastPlayed: lp, count: 1 })
    } else {
      cur.totalPlayed += tp
      cur.count += 1
      if (lp > cur.lastPlayed) cur.lastPlayed = lp
    }
  }

  // Average plays per category (so categories with few questions aren't unfairly penalized)
  const ranked = Array.from(stats.entries())
    .map(([cat, s]) => ({
      cat,
      avgPlayed: s.totalPlayed / s.count,
      lastPlayed: s.lastPlayed,
      r: Math.random(),
    }))
    .sort((a, b) => {
      if (a.avgPlayed !== b.avgPlayed) return a.avgPlayed - b.avgPlayed
      if (a.lastPlayed !== b.lastPlayed) return a.lastPlayed - b.lastPlayed
      return a.r - b.r
    })

  // Take top least-played candidates (2x needed for randomness pool), then randomly pick N
  const poolSize = Math.min(ranked.length, Math.max(needed * 2, needed))
  const candidatePool = ranked.slice(0, poolSize).map((x) => x.cat)
  const randomized = shuffle(candidatePool)
  return randomized.slice(0, Math.min(needed, randomized.length))
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
    const { sessionId, nickname, avatarId, language, questionsPerGame, questionTimeSeconds } = body

    // Input validation
    if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 64) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
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
    if (typeof language !== 'string' || !['en', 'tr'].includes(language)) {
      return new Response(JSON.stringify({ error: 'Invalid language' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const qpg = Number.isInteger(questionsPerGame) && questionsPerGame > 0 && questionsPerGame <= 50
      ? questionsPerGame : 10
    const qts = Number.isInteger(questionTimeSeconds) && questionTimeSeconds >= 5 && questionTimeSeconds <= 60
      ? questionTimeSeconds : 15

    // Generate game code
    const { data: gameCode, error: codeErr } = await supabase.rpc('generate_game_code')
    if (codeErr || !gameCode) {
      throw new Error('Code generation failed')
    }

    const { data: game, error: gameErr } = await supabase
      .from('games')
      .insert({ game_code: gameCode, language, status: 'waiting' })
      .select()
      .single()
    if (gameErr || !game) throw new Error('Game insert failed')

    const categories = ['general', 'science', 'math', 'sports', 'music']
    const categoryDist = buildCategoryDistribution(categories, qpg)

    await supabase.from('game_settings').insert({
      game_id: game.id,
      questions_per_game: qpg,
      question_time_seconds: qts,
      category_distribution: categoryDist,
    })

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        session_id: sessionId,
        nickname: nickname.trim(),
        avatar_id: avatarId,
        is_host: true,
      })
      .select()
      .single()
    if (playerErr || !player) throw new Error('Player insert failed')

    await supabase.from('games').update({ host_player_id: player.id }).eq('id', game.id)

    return new Response(JSON.stringify({ game, player }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const ref = crypto.randomUUID()
    console.error(`[${ref}] create-game error:`, e)
    return new Response(JSON.stringify({ error: 'Internal server error', ref }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
