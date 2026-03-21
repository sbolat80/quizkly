const gameConfig = {
  // Soru başına süre (saniye)
  // Test için: 5, Production için: 15
  QUESTION_TIME_SECONDS: 5,

  // Oyun başına soru sayısı
  // Test için: 3, Production için: 10
  QUESTIONS_PER_GAME: 3,

  // Faz süreleri (milisaniye)
  RESULT_PHASE_MS: 3000,
  LEADERBOARD_PHASE_MS: 3000,
} as const;

export default gameConfig;
