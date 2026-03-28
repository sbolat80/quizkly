import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/session';
import gameConfig from '@/config/gameConfig';

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCategoryDistribution(
  categories: string[],
  needed: number
): Record<string, number> {
  const shuffled = shuffle(categories);
  console.log('Random category order:', shuffled);
  const dist: Record<string, number> = {};
  for (const cat of shuffled) dist[cat] = 0;
  let remaining = needed;
  let catIdx = 0;
  while (remaining > 0) {
    dist[shuffled[catIdx % shuffled.length]]++;
    remaining--;
    catIdx++;
  }
  console.log('Category distribution:', dist, 'Total:', Object.values(dist).reduce((a, b) => a + b, 0));
  return dist;
}

export async function createGame(nickname: string, avatarId: number, language: string) {
  const sessionId = getSessionId();

  const { data: gameCode, error: codeErr } = await supabase.rpc('generate_game_code');
  if (codeErr || !gameCode) throw new Error('Could not generate game code');

  const { data: game, error: gameErr } = await supabase
    .from('games')
    .insert({ game_code: gameCode, language, status: 'waiting' })
    .select()
    .single();
  if (gameErr || !game) throw new Error('Could not create game');

  const categories = ['general', 'science', 'math', 'sports', 'music'];
  const questionsPerGame = gameConfig.QUESTIONS_PER_GAME;
  const categoryDist = buildCategoryDistribution(categories, questionsPerGame);

  await supabase
    .from('game_settings')
    .insert({
      game_id: game.id,
      questions_per_game: questionsPerGame,
      question_time_seconds: gameConfig.QUESTION_TIME_SECONDS,
      category_distribution: categoryDist,
    });

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      session_id: sessionId,
      nickname,
      avatar_id: avatarId,
      is_host: true,
    })
    .select()
    .single();
  if (playerErr || !player) throw new Error('Could not create player');

  await supabase
    .from('games')
    .update({ host_player_id: player.id })
    .eq('id', game.id);

  return { game, player };
}

export async function joinGame(code: string, nickname: string, avatarId: number) {
  const sessionId = getSessionId();

  const { data: game, error: gameErr } = await supabase
    .from('games')
    .select()
    .eq('game_code', code.toUpperCase())
    .single();
  if (gameErr || !game) throw new Error('Game not found');
  if (game.status !== 'waiting') throw new Error('Game already started');

  const { data: existingPlayers } = await supabase
    .from('players')
    .select('id, session_id')
    .eq('game_id', game.id)
    .eq('is_active', true);

  if ((existingPlayers?.length ?? 0) >= 8) throw new Error('Game is full');

  const existing = existingPlayers?.find((p) => p.session_id === sessionId);
  if (existing) return { game, player: existing };

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      session_id: sessionId,
      nickname,
      avatar_id: avatarId,
      is_host: false,
    })
    .select()
    .single();
  if (playerErr || !player) throw new Error('Could not join game');

  return { game, player };
}

export async function getGamePlayers(gameId: string) {
  const { data, error } = await supabase
    .from('players')
    .select()
    .eq('game_id', gameId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getGameSettings(gameId: string) {
  const { data, error } = await supabase
    .from('game_settings')
    .select('*')
    .eq('game_id', gameId)
    .maybeSingle();

  if (error || !data) {
    return {
      questions_per_game: gameConfig.QUESTIONS_PER_GAME,
      question_time_seconds: gameConfig.QUESTION_TIME_SECONDS,
      category_distribution: {
        general: 2,
        science: 2,
        math: 2,
        sports: 2,
        music: 2,
      },
    };
  }
  return data;
}

export async function startGame(gameId: string, language: string) {
  const { data, error } = await supabase.functions.invoke('start-game', {
    body: { gameId, language },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { success: true };
}

export async function getGameQuestions(gameId: string) {
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke('get-game-questions', {
    body: { gameId, sessionId },
  });
  if (error) throw error;
  return data ?? [];
}

export async function submitAnswer(
  gameId: string,
  questionId: string,
  playerId: string,
  sessionId: string,
  submittedAnswer: string,
  responseTimeMs: number
) {
  const { data, error } = await supabase.functions.invoke('submit-answer', {
    body: { gameId, questionId, playerId, sessionId, submittedAnswer, responseTimeMs },
  });
  if (error) throw error;
  return data as { is_correct: boolean; points_awarded: number; correct_index: number; question_time_seconds: number };
}

export async function advancePhase(gameId: string, config?: {
  question_time_ms?: number;
  result_phase_ms?: number;
  leaderboard_ms?: number;
  expected_phase?: string;
  expected_phase_started_at?: string;
}) {
  const { data, error } = await supabase.functions.invoke('advance-phase', {
    body: {
      gameId,
      question_time_ms: config?.question_time_ms ?? gameConfig.QUESTION_TIME_SECONDS * 1000,
      result_phase_ms: config?.result_phase_ms ?? gameConfig.RESULT_PHASE_MS,
      leaderboard_ms: config?.leaderboard_ms ?? gameConfig.LEADERBOARD_PHASE_MS,
      expected_phase: config?.expected_phase,
      expected_phase_started_at: config?.expected_phase_started_at,
    },
  });
  if (error) throw error;
  return data as { phase: string; question_index: number; status?: string; already_advanced?: boolean };
}

export async function resetGame(gameId: string) {
  await supabase.from('answers').delete().eq('game_id', gameId);
  await supabase.from('game_questions').delete().eq('game_id', gameId);
  await supabase.from('players').update({ score: 0 }).eq('game_id', gameId);
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
    .eq('id', gameId);
}

export function subscribeToGame(
  gameId: string,
  callback: (game: any) => void
) {
  return supabase
    .channel(`game-${gameId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

export function subscribeToPlayers(
  gameId: string,
  callback: (players: any[]) => void
) {
  return supabase
    .channel(`players-${gameId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
      async () => {
        const players = await getGamePlayers(gameId);
        callback(players);
      }
    )
    .subscribe();
}
