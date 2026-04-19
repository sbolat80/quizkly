import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Fisher-Yates shuffle
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
  let catIdx = 0
  while (remaining > 0) {
    dist[shuffled[catIdx % shuffled.length]]++
    remaining--
    catIdx++
  }
  return dist
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

    const { gameId, language } = await req.json()

    if (!gameId || !language) {
      return new Response(JSON.stringify({ error: 'Missing gameId or language' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify game is in waiting state
    const { data: game, error: gameErr } = await supabase
      .from('games')
      .select('status')
      .eq('id', gameId)
      .single()

    if (gameErr || !game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (game.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game is not in waiting state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Read settings
    const { data: settings } = await supabase
      .from('game_settings')
      .select('*')
      .eq('game_id', gameId)
      .maybeSingle()

    const needed = settings?.questions_per_game ?? 10
    const rawDist = (settings?.category_distribution ?? {}) as Record<string, number>

    const distTotal = Object.values(rawDist).reduce((a: number, b: number) => a + b, 0)
    const finalDist = distTotal !== needed
      ? buildCategoryDistribution(Object.keys(rawDist).length > 0 ? Object.keys(rawDist) : ['general', 'science', 'math', 'sports', 'music'], needed)
      : rawDist

    // Check if questions already inserted
    const { count: existing } = await supabase
      .from('game_questions')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    if ((existing ?? 0) === 0) {
      const { data: allQuestions, error: qErr } = await supabase
        .from('questions')
        .select('id, category, times_played, last_played_at')
        .eq('is_active', true)
        .eq('language', language)

      if (qErr || !allQuestions) {
        return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (allQuestions.length < needed) {
        return new Response(JSON.stringify({ error: `Not enough questions. Found: ${allQuestions.length}, needed: ${needed}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Sort by times_played ASC, last_played_at ASC NULLS FIRST, random tiebreak
      const sortByLeastPlayed = (arr: typeof allQuestions) => {
        return [...arr]
          .map((q) => ({ q, r: Math.random() }))
          .sort((a, b) => {
            const tpA = a.q.times_played ?? 0
            const tpB = b.q.times_played ?? 0
            if (tpA !== tpB) return tpA - tpB
            const lpA = a.q.last_played_at ? new Date(a.q.last_played_at).getTime() : -Infinity
            const lpB = b.q.last_played_at ? new Date(b.q.last_played_at).getTime() : -Infinity
            if (lpA !== lpB) return lpA - lpB
            return a.r - b.r
          })
          .map((x) => x.q)
      }

      // Group by category and apply least-played ordering within each
      const categoryGroups: Record<string, typeof allQuestions> = {}
      for (const q of allQuestions) {
        if (!categoryGroups[q.category]) categoryGroups[q.category] = []
        categoryGroups[q.category].push(q)
      }
      for (const cat of Object.keys(categoryGroups)) {
        categoryGroups[cat] = sortByLeastPlayed(categoryGroups[cat])
      }

      // Select by distribution
      const selected: typeof allQuestions = []
      const selectedIds = new Set<string>()

      for (const [cat, count] of Object.entries(finalDist)) {
        if (count === 0) continue
        const pool = categoryGroups[cat] || []
        let picked = 0
        for (const q of pool) {
          if (picked >= count) break
          if (!selectedIds.has(q.id)) {
            selected.push(q)
            selectedIds.add(q.id)
            picked++
          }
        }
      }

      // Fill remaining using least-played across all categories
      if (selected.length < needed) {
        const remaining = sortByLeastPlayed(allQuestions.filter(q => !selectedIds.has(q.id)))
        for (const q of remaining) {
          if (selected.length >= needed) break
          selected.push(q)
          selectedIds.add(q.id)
        }
      }

      // Final presentation order: shuffle so categories are interleaved
      const shuffled = shuffle(selected)
      const { error: insertErr } = await supabase
        .from('game_questions')
        .insert(shuffled.map((q, i) => ({
          game_id: gameId,
          question_id: q.id,
          question_order: i + 1,
        })))

      if (insertErr) {
        console.error('Failed to insert game_questions:', insertErr)
        return new Response(JSON.stringify({ error: 'Failed to insert questions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Increment times_played and update last_played_at on selected questions
      const nowIso = new Date().toISOString()
      const updates = shuffled.map((q) =>
        supabase
          .from('questions')
          .update({
            times_played: (q.times_played ?? 0) + 1,
            last_played_at: nowIso,
          })
          .eq('id', q.id)
      )
      const updateResults = await Promise.all(updates)
      const updateError = updateResults.find((r) => r.error)
      if (updateError?.error) {
        console.error('Failed to update question play stats:', updateError.error)
      }
    }

    // Get real count
    const { count: realCount } = await supabase
      .from('game_questions')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    // Update game status
    const { error: updateErr } = await supabase
      .from('games')
      .update({
        status: 'in_progress',
        current_question_index: 0,
        total_questions: realCount ?? needed,
        started_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (updateErr) {
      console.error('Failed to update game:', updateErr)
      return new Response(JSON.stringify({ error: 'Failed to start game' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('start-game error:', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
