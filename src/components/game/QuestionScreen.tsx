import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { useI18n } from '@/i18n';
import { useServerTimer } from '@/hooks/use-server-timer';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
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
  useLockBodyScroll();
  const { t } = useI18n();
  const { submitAnswer } = useGame();
  const game = useGameStore((s) => s.game);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questionData = questions[currentQuestionIndex];
  const effectiveTimeLimit = questionData?.timeLimit ?? gameConfig.QUESTION_TIME_SECONDS;

  // Capture the phase_started_at when this question first renders so that
  // a later phase change doesn't cause the timer to flash back to full duration.
  const frozenPhaseRef = useRef<string | null>(null);
  if (game?.phase === 'question_active' && game?.phase_started_at) {
    frozenPhaseRef.current = game.phase_started_at;
  }
  const rawTimeLeft = useServerTimer(frozenPhaseRef.current, effectiveTimeLimit);
  const timeLeft = Math.min(rawTimeLeft, effectiveTimeLimit);

  const question = questionData?.questions ?? questionData;
  const questionText = question?.text || question?.question_text || 'Loading...';

  // Don't guard on phase here — the screen routing in GameShell already
  // controls visibility. Returning null caused a blank flash for the host
  // between navigate('question') and advancePhase completing.

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

  const displayTime = Math.max(0, Math.ceil(timeLeft));
  const timerPercent = Math.max(0, (timeLeft / effectiveTimeLimit) * 100);

  const getButtonClass = (index: number) => {
    if (!hasAnswered) return OPTION_COLORS[index];
    if (selectedAnswer === index) return 'bg-white/20 ring-2 ring-white/60 text-foreground';
    return OPTION_COLORS[index] + ' opacity-40';
  };

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}
      className="flex flex-col bg-background px-4 pt-4 pb-6 safe-x"
    >
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-muted-foreground">
          {t('question')} {currentQuestionIndex + 1}/{questions.length}
        </span>
        <motion.span
          key={displayTime}
          initial={displayTime > 0 ? { scale: 1.15, opacity: 0.8 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className={`text-2xl font-black tabular-nums ${getTimeColor(timeLeft, effectiveTimeLimit)} ${timeLeft <= 3 ? 'animate-pulse' : ''}`}
        >
          {displayTime}s
        </motion.span>
      </div>

      {/* Timer bar */}
      <div className="flex-shrink-0 mb-4 h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-full rounded-full ${getBarColor(timeLeft, effectiveTimeLimit)}`}
          style={{ width: `${timerPercent}%`, transition: 'width 150ms linear, background-color 0.5s ease' }}
        />
      </div>

      {/* Question text */}
      <div className="flex-shrink-0 mb-6 text-center">
        <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-tight">
          {questionText}
        </h2>
      </div>

      {/* Answer buttons + locked message */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {options.map((option, index) => (
          <motion.button
            key={index}
            whileTap={!hasAnswered ? { scale: 0.97 } : undefined}
            onClick={() => handleAnswer(index)}
            disabled={hasAnswered}
            className={`flex-shrink-0 h-14 sm:h-16 rounded-2xl px-4 flex items-center gap-3 font-bold shadow-md transition-all ${getButtonClass(index)} ${hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${selectedAnswer === index && hasAnswered ? 'bg-primary text-white' : 'bg-white/20 text-white'}`}>
              {OPTION_LABELS[index]}
            </span>
            <span className="text-left text-sm leading-tight">{option}</span>
          </motion.button>
        ))}

        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 flex justify-center"
          >
            <p className="rounded-full bg-muted px-4 py-2 text-center text-sm font-semibold text-muted-foreground">
              ✅ {t('answerLocked')}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionScreen;
