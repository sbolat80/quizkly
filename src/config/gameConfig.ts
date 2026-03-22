// Bu değerler sadece fallback olarak kullanılır.
// Gerçek değerler game_settings tablosundan gelir.
// Test için buradaki değerleri değiştirebilirsin
// ama production'da DB değerleri önceliklidir.
const gameConfig = {
  QUESTION_TIME_SECONDS: 8, // fallback (test: 7, prod: 10)
  QUESTIONS_PER_GAME: 10, // fallback (test: 5, prod: 10)
  RESULT_PHASE_MS: 2500,
  LEADERBOARD_PHASE_MS: 2500,
} as const;

export default gameConfig;
