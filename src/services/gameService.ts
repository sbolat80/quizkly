import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import gameConfig from "@/config/gameConfig";

export async function createGame(nickname: string, avatarId: number, language: string) {
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke("create-game", {
    body: {
      sessionId,
      nickname,
      avatarId,
      language,
      questionsPerGame: gameConfig.QUESTIONS_PER_GAME,
      questionTimeSeconds: gameConfig.QUESTION_TIME_SECONDS,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { game: data.game, player: data.player };
}

export async function joinGame(code: string, nickname: string, avatarId: number) {
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke("join-game", {
    body: { sessionId, code, nickname, avatarId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { game: data.game, player: data.player };
}

export async function getGamePlayers(gameId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("id, game_id, nickname, avatar_id, score, is_host, is_active, joined_at")
    .eq("game_id", gameId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getGameSettings(gameId: string) {
  const { data, error } = await supabase.from("game_settings").select("*").eq("game_id", gameId).maybeSingle();

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
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke("start-game", {
    body: { gameId, language, sessionId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { success: true };
}

export async function getGameQuestions(gameId: string) {
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke("get-game-questions", {
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
  responseTimeMs: number,
) {
  const { data, error } = await supabase.functions.invoke("submit-answer", {
    body: { gameId, questionId, playerId, sessionId, submittedAnswer, responseTimeMs },
  });
  if (error) throw error;
  return data as { is_correct: boolean; points_awarded: number; correct_index: number; question_time_seconds: number };
}

export async function advancePhase(
  gameId: string,
  config?: {
    question_time_ms?: number;
    result_phase_ms?: number;
    leaderboard_ms?: number;
    expected_phase?: string;
    expected_phase_started_at?: string;
  },
) {
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke("advance-phase", {
    body: {
      gameId,
      sessionId,
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
  const sessionId = getSessionId();
  const { data, error } = await supabase.functions.invoke("reset-game", {
    body: { gameId, sessionId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

export function subscribeToGame(gameId: string, callback: (game: any) => void) {
  return supabase
    .channel(`game-${gameId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
      (payload) => callback(payload.new),
    )
    .subscribe();
}

export function subscribeToPlayers(gameId: string, callback: (players: any[]) => void) {
  return supabase
    .channel(`players-${gameId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
      async () => {
        const players = await getGamePlayers(gameId);
        callback(players);
      },
    )
    .subscribe();
}
