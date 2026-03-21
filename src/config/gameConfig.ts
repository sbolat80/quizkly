// Bu değerler sadece fallback olarak kullanılır.
// Gerçek değerler game_settings tablosundan gelir.
// Test için buradaki değerleri değiştirebilirsin
// ama production'da DB değerleri önceliklidir.
const gameConfig = {
  QUESTION_TIME_SECONDS: 5,  // fallback (test: 5, prod: 15)
  QUESTIONS_PER_GAME: 3,     // fallback (test: 3, prod: 10)
  RESULT_PHASE_MS: 3000,
  LEADERBOARD_PHASE_MS: 4000,
} as const;

export default gameConfig;
