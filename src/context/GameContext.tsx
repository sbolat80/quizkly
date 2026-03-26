import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import * as gameService from '@/services/gameService';
import { getSessionId } from '@/lib/session';
import gameConfig from '@/config/gameConfig';
import type { GameScreen } from '@/types/game';
import { toast } from 'sonner';

const PHASE_DURATIONS = {
  question_active: gameConfig.QUESTION_TIME_SECONDS * 1000,
  result_phase: gameConfig.RESULT_PHASE_MS,
  leaderboard: gameConfig.LEADERBOARD_PHASE_MS,
};

interface GameContextType {
  createGame: (nickname: string, avatarId: number, language: string) => Promise<void>;
  joinGame: (code: string, nickname: string, avatarId: number) => Promise<boolean>;
  startGame: () => Promise<void>;
  submitAnswer: (optionIndex: number) => Promise<any>;
  goHome: () => void;
  playAgain: () => Promise<void>;
  navigate: (screen: GameScreen) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const store = useGameStore();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameSubRef = useRef<any>(null);
  const playerSubRef = useRef<any>(null);
  const hasShownCountdownRef = useRef(false);

  const clearPhaseTimer = useCallback(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  const cleanupSubscriptions = useCallback(() => {
    if (gameSubRef.current) {
      gameSubRef.current.unsubscribe();
      gameSubRef.current = null;
    }
    if (playerSubRef.current) {
      playerSubRef.current.unsubscribe();
      playerSubRef.current = null;
    }
  }, []);

  const scheduleNextPhase = useCallback((updatedGame: any) => {
    clearPhaseTimer();

    if (!updatedGame.phase_started_at || !updatedGame.phase) return;

    const duration = PHASE_DURATIONS[updatedGame.phase as keyof typeof PHASE_DURATIONS];
    if (!duration) return;

    const elapsed = Date.now() - new Date(updatedGame.phase_started_at).getTime();
    const remaining = Math.max(0, duration - elapsed);

    // Add a small random jitter (0-500ms) so not all clients fire at exactly the same time
    const jitter = Math.floor(Math.random() * 500);

    // Capture the expected phase state for idempotency
    const expectedPhase = updatedGame.phase;
    const expectedPhaseStartedAt = updatedGame.phase_started_at;

    phaseTimerRef.current = setTimeout(async () => {
      try {
        // Client-side guard: check if phase already changed before making the network call
        const currentGame = useGameStore.getState().game;
        if (currentGame && (currentGame.phase !== expectedPhase || currentGame.phase_started_at !== expectedPhaseStartedAt)) {
          console.log('Phase already changed client-side, skipping advancePhase call');
          return;
        }
        console.log('Calling advancePhase (any client)...', { expectedPhase, expectedPhaseStartedAt });
        const result = await gameService.advancePhase(updatedGame.id, {
          question_time_ms: gameConfig.QUESTION_TIME_SECONDS * 1000,
          result_phase_ms: gameConfig.RESULT_PHASE_MS,
          leaderboard_ms: gameConfig.LEADERBOARD_PHASE_MS,
          expected_phase: expectedPhase,
          expected_phase_started_at: expectedPhaseStartedAt,
        });
        console.log('advancePhase result:', result);
        if (result?.already_advanced) {
          console.log('Phase already advanced by another client, ignoring.');
          return;
        }
        if (result?.phase === 'finished' || result?.status === 'finished') {
          console.log('GAME FINISHED from advancePhase!');
          clearPhaseTimer();
          useGameStore.getState().setScreen('final');
        }
      } catch (e) {
        console.error('advancePhase failed:', e);
      }
    }, remaining + jitter);
  }, [clearPhaseTimer]);

  const resetPlayerAnswerState = useCallback(() => {
    const prev = useGameStore.getState().currentPlayer;
    if (prev) {
      useGameStore.getState().setCurrentPlayer({
        ...prev,
        currentAnswer: null,
        lastWasCorrect: null,
        lastCorrectIndex: null,
      });
    }
  }, []);

  const loadQuestionsAndStartCountdown = useCallback(async (updatedGame: any) => {
    if (hasShownCountdownRef.current) return;
    hasShownCountdownRef.current = true;
    try {
      const gqs = await gameService.getGameQuestions(updatedGame.id);
      console.log('Raw game questions:', JSON.stringify(gqs[0]));
      const settings = await gameService.getGameSettings(updatedGame.id);
      const mapped = gqs.map((gq: any) => {
        const q = gq.questions ?? gq;
        const options = Array.isArray(q.options)
          ? q.options.map((o: any) => String(o))
          : typeof q.options === 'string'
            ? JSON.parse(q.options)
            : [];
        return {
          id: q.id,
          question_id: q.id,
          text: q.question_text ?? q.text ?? '',
          options,
          correctAnswer: q.correct_answer ?? '',
          category: q.category ?? '',
          timeLimit: settings.question_time_seconds,
        };
      });
      console.log('Mapped questions:', mapped);
      useGameStore.getState().setQuestions(mapped);
      useGameStore.getState().setCurrentQuestionIndex(updatedGame.current_question_index ?? 0);
      useGameStore.getState().setScreen('countdown');
    } catch (e) {
      console.error('loadQuestions failed:', e);
      hasShownCountdownRef.current = false;
    }
  }, []);

  const handleGameUpdate = useCallback(async (updatedGame: any) => {
    console.log('=== GAME UPDATE ===', {
      status: updatedGame.status,
      phase: updatedGame.phase,
      currentIdx: updatedGame.current_question_index,
      totalQ: updatedGame.total_questions,
    });
    const s = useGameStore.getState();

    if (updatedGame.status === 'finished' || updatedGame.phase === 'finished') {
      console.log('>>> GAME FINISHED <<<');
      clearPhaseTimer();
      try {
        const finalPlayers = await gameService.getGamePlayers(updatedGame.id);
        s.setPlayers(finalPlayers);
      } catch (e) {
        console.error('getGamePlayers on finish failed:', e);
      }
      s.setGame(updatedGame);
      s.setScreen('final');
      return;
    }

    s.setGame(updatedGame);

    if (updatedGame.status === 'waiting') {
      clearPhaseTimer();
      hasShownCountdownRef.current = false;
      s.setQuestions([]);
      s.setCurrentQuestionIndex(0);
      resetPlayerAnswerState();
      const players = await gameService.getGamePlayers(updatedGame.id);
      s.setPlayers(players);
      s.setScreen('waiting');
      return;
    }

    if (updatedGame.status === 'in_progress') {
      if (!hasShownCountdownRef.current) {
        await loadQuestionsAndStartCountdown(updatedGame);
        return;
      }

      if (updatedGame.phase) {
        const phase = updatedGame.phase;

        if (phase === 'question_active') {
          const newIdx = updatedGame.current_question_index ?? 0;
          s.setCurrentQuestionIndex(newIdx);
          resetPlayerAnswerState();
          s.setScreen('question');
        } else if (phase === 'result_phase') {
          s.setScreen('round_result');
        } else if (phase === 'leaderboard') {
          const players = await gameService.getGamePlayers(updatedGame.id);
          s.setPlayers(players);
          s.setScreen('leaderboard');
        }

        scheduleNextPhase(updatedGame);
      }
    }
  }, [clearPhaseTimer, loadQuestionsAndStartCountdown, resetPlayerAnswerState, scheduleNextPhase]);

  const setupSubscriptions = useCallback((gameId: string) => {
    cleanupSubscriptions();

    gameSubRef.current = gameService.subscribeToGame(gameId, async (updatedGame: any) => {
      console.log('RAW subscription update:', {
        status: updatedGame.status,
        phase: updatedGame.phase,
      });
      if (updatedGame.status === 'finished' || updatedGame.phase === 'finished') {
        console.log('Finished from subscription!');
        clearPhaseTimer();
        try {
          const finalPlayers = await gameService.getGamePlayers(updatedGame.id);
          useGameStore.getState().setPlayers(finalPlayers);
        } catch (e) {
          console.error(e);
        }
        useGameStore.getState().setGame(updatedGame);
        useGameStore.getState().setScreen('final');
        return;
      }
      await handleGameUpdate(updatedGame);
    });

    playerSubRef.current = gameService.subscribeToPlayers(gameId, (updatedPlayers) => {
      const s = useGameStore.getState();
      s.setPlayers(updatedPlayers);
      const sessionId = getSessionId();
      const me = updatedPlayers.find((p: any) => p.session_id === sessionId);
      if (me) {
        const prev = s.currentPlayer;
        s.setCurrentPlayer(prev ? {
          ...me,
          currentAnswer: prev.currentAnswer ?? null,
          lastWasCorrect: prev.lastWasCorrect ?? null,
          lastCorrectIndex: prev.lastCorrectIndex ?? null,
        } : me);
      }
      const map: Record<string, number> = {};
      updatedPlayers.forEach((p: any) => { map[p.id] = p.avatar_id ?? 1; });
      s.setAvatarMap(map);
    });
  }, [cleanupSubscriptions, handleGameUpdate]);

  useEffect(() => {
    return () => {
      clearPhaseTimer();
      cleanupSubscriptions();
    };
  }, [clearPhaseTimer, cleanupSubscriptions]);

  const createGame = useCallback(async (nickname: string, avatarId: number, language: string) => {
    store.setLoading(true);
    try {
      const { game, player } = await gameService.createGame(nickname, avatarId, language);
      store.setGame(game);
      store.setCurrentPlayer(player);
      const players = await gameService.getGamePlayers(game.id);
      store.setPlayers(players);
      setupSubscriptions(game.id);
      store.setScreen('waiting');
    } finally {
      store.setLoading(false);
    }
  }, [store, setupSubscriptions]);

  const joinGame = useCallback(async (code: string, nickname: string, avatarId: number): Promise<boolean> => {
    store.setLoading(true);
    try {
      const { game, player } = await gameService.joinGame(code, nickname, avatarId);
      store.setGame(game);
      store.setCurrentPlayer(player);
      const players = await gameService.getGamePlayers(game.id);
      store.setPlayers(players);
      setupSubscriptions(game.id);
      store.setScreen('waiting');
      return true;
    } catch {
      return false;
    } finally {
      store.setLoading(false);
    }
  }, [store, setupSubscriptions]);

  const startGameAction = useCallback(async () => {
    const { game, currentPlayer } = useGameStore.getState();
    if (!game || !currentPlayer?.is_host) return;
    store.setLoading(true);
    try {
      const gameLanguage = game.language || 'en';
      await gameService.startGame(game.id, gameLanguage);
    } catch (e: any) {
      toast.error(e.message || 'Failed to start game');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const submitAnswer = useCallback(async (optionIndex: number) => {
    const { game, currentPlayer, questions, currentQuestionIndex } = useGameStore.getState();
    if (!game || !currentPlayer || !questions.length) return null;

    const q = questions[currentQuestionIndex];
    if (!q) return null;

    const selectedOption = q.options[optionIndex];
    const responseTimeMs = game?.phase_started_at
      ? Date.now() - new Date(game.phase_started_at).getTime()
      : 5000;

    // Optimistic UI
    store.setCurrentPlayer({
      ...currentPlayer,
      currentAnswer: optionIndex,
    });

    try {
      const result = await gameService.submitAnswer(
        game.id,
        q.question_id ?? q.id,
        currentPlayer.id,
        getSessionId(),
        selectedOption,
        responseTimeMs
      );
      const latest = useGameStore.getState().currentPlayer;
      store.setCurrentPlayer({
        ...latest,
        currentAnswer: optionIndex,
        lastWasCorrect: result.is_correct,
        lastCorrectIndex: result.correct_index,
        score: (latest?.score ?? 0) + (result.points_awarded ?? 0),
      });
      return result;
    } catch (e) {
      console.error('submitAnswer failed:', e);
      return null;
    }
  }, [store]);

  const goHome = useCallback(() => {
    clearPhaseTimer();
    cleanupSubscriptions();
    hasShownCountdownRef.current = false;
    store.reset();
  }, [clearPhaseTimer, cleanupSubscriptions, store]);

  const playAgain = useCallback(async () => {
    const { game, currentPlayer } = useGameStore.getState();
    if (!game?.id || !currentPlayer?.is_host) return;
    try {
      await gameService.resetGame(game.id);
    } catch (e) {
      console.error('resetGame failed:', e);
    }
  }, []);

  const navigateTo = useCallback((screen: GameScreen) => {
    store.setScreen(screen);
    if (screen === 'question') {
      const { game, currentPlayer } = useGameStore.getState();
      if (game && currentPlayer?.is_host) {
        gameService.advancePhase(game.id, {
          question_time_ms: gameConfig.QUESTION_TIME_SECONDS * 1000,
          result_phase_ms: gameConfig.RESULT_PHASE_MS,
          leaderboard_ms: gameConfig.LEADERBOARD_PHASE_MS,
        }).catch(console.error);
      }
    }
  }, [store]);

  const value: GameContextType = {
    createGame,
    joinGame,
    startGame: startGameAction,
    submitAnswer,
    goHome,
    playAgain,
    navigate: navigateTo,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
