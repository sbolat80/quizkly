import { create } from 'zustand';
import type { GameScreen } from '@/types/game';

interface GameStore {
  screen: GameScreen;
  game: any | null;
  players: any[];
  currentPlayer: any | null;
  questions: any[];
  currentQuestionIndex: number;
  timeLeft: number;
  loading: boolean;
  avatarMap: Record<string, number>;
  gameSettings: { question_time_seconds: number } | null;

  setScreen: (screen: GameScreen) => void;
  setGame: (game: any) => void;
  setPlayers: (players: any[]) => void;
  setCurrentPlayer: (player: any) => void;
  setQuestions: (questions: any[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setTimeLeft: (time: number) => void;
  setLoading: (loading: boolean) => void;
  setAvatarMap: (map: Record<string, number>) => void;
  setGameSettings: (settings: { question_time_seconds: number }) => void;
  reset: () => void;
}

const initialState = {
  screen: 'home' as GameScreen,
  game: null,
  players: [],
  currentPlayer: null,
  questions: [],
  currentQuestionIndex: 0,
  timeLeft: 0,
  loading: false,
  avatarMap: {},
  gameSettings: null as { question_time_seconds: number } | null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setScreen: (screen) => set({ screen }),
  setGame: (game) => set({ game }),
  setPlayers: (players) => set({ players }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setQuestions: (questions) => set({ questions }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setTimeLeft: (time) => set({ timeLeft: time }),
  setLoading: (loading) => set({ loading }),
  setAvatarMap: (map) => set({ avatarMap: map }),
  setGameSettings: (settings) => set({ gameSettings: settings }),
  reset: () => set(initialState),
}));
