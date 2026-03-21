import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { useI18n } from '@/i18n';
import { useServerTimer } from '@/hooks/use-server-timer';
import { playTap } from '@/lib/sounds';
import gameConfig from '@/config/gameConfig';

const OPTION_COLORS = [
  'bg-red-500 hover:bg-red-500/90',
  'bg-blue-500 hover:bg-blue-500/90',
  'bg-orange-500 hover:bg-orange-500/90',
  'bg-green-500 hover:bg-green-500/90',
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const getBarColor = (timeLeft: number, duration: number) => {
  const ratio = timeLeft / duration;
  if (ratio > 0.5) return 'bg-emerald-500';
  if (ratio > 0.25) return 'bg-amber-500';
  return 'bg-red-500';
};

const getTimeColor = (timeLeft: number, duration: number) => {
  const ratio = timeLeft / duration;
  if (ratio > 0.5) return 'text-emerald-500';
  if (ratio > 0.25) return 'text-amber-500';
  return 'text-red-500';
};

const QuestionScreen = () => {
  const { t } = useI18n();
  const { submitAnswer } = useGame();
  const game = useGameStore((s) => s.game);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questionData = questions[currentQuestionIndex];
  const effectiveTimeLimit = questionData?.timeLimit ?? gameConfig.QUESTION_TIME_SECONDS;
  const timeLeft = useServerTimer(game?.phase_started_at ?? null, effectiveTimeLimit);

  const question = questionData?.questions ?? questionData;
  const questionText = question?.text || question?.question_text || 'Loading...';

  if (!question) {
    return (
      <motion.div
        key="question-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center bg-background px-4"
      >
        <p className="text-lg text-muted-foreground">{t('loadingQuestion')}</p>
      </motion.div>
    );
  }

  const options: string[] = Array.isArray(question.options)
    ? question.options
    : JSON.parse(question.options as string);

  const hasAnswered = selectedAnswer !== null;

  const handleAnswer = async (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
    playTap();
    await submitAnswer(index);
  };

  const displayTime = Math.ceil(timeLeft);
  const timerPercent = Math.max(0, (timeLeft / effectiveTimeLimit) * 100);

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col bg-background px-4 py-4 safe-x"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-muted-foreground">
          {t('question')} {currentQuestionIndex + 1}/{questions.length}
        </span>
        <motion.span
          key={displayTime}
          initial={{ scale: 1.2, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-2xl font-black tabular-nums ${getTimeColor(timeLeft, effectiveTimeLimit)} ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
        >
          {displayTime}s
        </motion.span>
      </div>

      {/* Timer bar */}
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-full rounded-full ${getBarColor(timeLeft, effectiveTimeLimit)}`}
          style={{ width: `${timerPercent}%`, transition: 'width 1s linear, background-color 0.5s ease' }}
        />
      </div>

      {/* Question text */}
      <h2 className="text-2xl font-extrabold text-foreground text-center leading-tight mb-8">
        {questionText}
      </h2>

      {/* Answer buttons */}
      <div className="flex flex-col gap-3 flex-1">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isOther = hasAnswered && !isSelected;

          return (
            <motion.button
              key={index}
              whileTap={!hasAnswered ? { scale: 0.97 } : undefined}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
              className={`h-14 rounded-2xl px-4 flex items-center gap-3 text-white font-bold transition-all ${
                isSelected
                  ? 'bg-muted text-muted-foreground ring-2 ring-muted-foreground/30'
                  : isOther
                    ? `${OPTION_COLORS[index]} opacity-60`
                    : OPTION_COLORS[index]
              }`}
            >
              <span className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">
                {OPTION_LABELS[index]}
              </span>
              <span className="text-left text-sm leading-tight">{option}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Answer locked message */}
      {hasAnswered && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground mt-4 pb-4"
        >
          ✅ {t('answerLocked')}
        </motion.p>
      )}
    </motion.div>
  );
};

export default QuestionScreen;
