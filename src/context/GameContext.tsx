import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import * as gameService from '@/services/gameService';
import type { GameScreen } from '@/types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const gameChannelRef = useRef<RealtimeChannel | null>(null);
  const playerChannelRef = useRef<RealtimeChannel | null>(null);

  const cleanup = useCallback(() => {
    gameChannelRef.current?.unsubscribe();
    playerChannelRef.current?.unsubscribe();
    gameChannelRef.current = null;
    playerChannelRef.current = null;
  }, []);

  const setupSubscriptions = useCallback((gameId: string) => {
    cleanup();

    gameChannelRef.current = gameService.subscribeToGame(gameId, (game) => {
      store.setGame(game);

      if (game.status === 'finished') {
        store.setScreen('final');
        return;
      }
      if (game.status === 'waiting') {
        store.setScreen('waiting');
        return;
      }

      switch (game.phase) {
        case 'question_active':
          store.setCurrentQuestionIndex(game.current_question_index ?? 0);
          store.setScreen('question');
          break;
        case 'result_phase':
          store.setScreen('round_result');
          break;
        case 'leaderboard':
          store.setScreen('leaderboard');
          break;
      }
    });

    playerChannelRef.current = gameService.subscribeToPlayers(gameId, (players) => {
      store.setPlayers(players);
      const map: Record<string, number> = {};
      players.forEach((p) => { map[p.id] = p.avatar_id ?? 1; });
      store.setAvatarMap(map);
    });
  }, [cleanup, store]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
    const game = useGameStore.getState().game;
    if (!game) return;
    store.setLoading(true);
    try {
      const questions = await gameService.getGameQuestions(game.id);
      store.setQuestions(questions);
      await gameService.startGame(game.id, game.language ?? 'en');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const submitAnswer = useCallback(async (optionIndex: number) => {
    const { game, currentPlayer, questions, currentQuestionIndex } = useGameStore.getState();
    if (!game || !currentPlayer) return null;
    const q = questions[currentQuestionIndex];
    if (!q) return null;

    const questionId = q.question_id ?? q.id;
    return gameService.submitAnswer(
      game.id,
      questionId,
      currentPlayer.id,
      currentPlayer.session_id,
      String(optionIndex),
      0
    );
  }, []);

  const goHome = useCallback(() => {
    cleanup();
    store.reset();
  }, [cleanup, store]);

  const playAgain = useCallback(async () => {
    const game = useGameStore.getState().game;
    if (!game) return;
    await gameService.resetGame(game.id);
  }, []);

  const navigateTo = useCallback((screen: GameScreen) => {
    store.setScreen(screen);
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
