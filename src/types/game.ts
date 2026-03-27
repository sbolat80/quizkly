export type GameStatus = 'waiting' | 'in_progress' | 'finished';

export type GamePhase = 'question_active' | 'result_phase' | 'leaderboard';

export type GameScreen =
  | 'home' | 'create' | 'join' | 'waiting'
  | 'countdown' | 'question' | 'round_result'
  | 'leaderboard' | 'final';

export interface Player {
  id: string;
  gameId: string;
  sessionId: string;
  nickname: string;
  avatarId: string;
  score: number;
  isHost: boolean;
  isActive: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  category: string;
  difficulty: string;
  language: string;
  timeLimit: number;
}

export interface GameRoom {
  id: string;
  code: string;
  status: GameStatus;
  phase: GamePhase;
  phaseStartedAt: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  language: string;
  hostPlayerId: string;
  players: Player[];
  questions: Question[];
}
