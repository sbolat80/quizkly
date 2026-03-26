import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import { useGameStore } from '@/stores/gameStore';
import { useI18n } from '@/i18n';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { playCorrect, playWrong, playTimeUp } from '@/lib/sounds';

import answerCorrect from '@/assets/answer-correct.png';
import answerFalse from '@/assets/answer-false.png';
import answerTimeout from '@/assets/answer-timeout.png';

const RoundResult = () => {
  useLockBodyScroll();
  const { t } = useI18n();
  const game = useGameStore((s) => s.game);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const totalQuestions = game?.total_questions ?? questions.length;
  const isLastQuestion = currentQuestionIndex + 1 >= totalQuestions;

  // Capture result state on mount to prevent flash when state resets
  const snapshotRef = useRef<{ answered: boolean; correct: boolean; correctIdx: number | null } | null>(null);
  if (snapshotRef.current === null) {
    snapshotRef.current = {
      answered: currentPlayer?.currentAnswer != null,
      correct: currentPlayer?.lastWasCorrect === true,
      correctIdx: currentPlayer?.lastCorrectIndex ?? null,
    };
  }

  const playerAnswered = snapshotRef.current.answered;
  const isCorrect = snapshotRef.current.correct;
  const resolvedIdx = snapshotRef.current.correctIdx;
  const question = questions[currentQuestionIndex];
  const correctAnswerText =
    resolvedIdx != null && question?.options
      ? question.options[resolvedIdx]
      : null;

  const resultImage = !playerAnswered
    ? answerTimeout
    : isCorrect
      ? answerCorrect
      : answerFalse;

  const soundPlayed = useRef(false);
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    if (playerAnswered && isCorrect) playCorrect();
    else if (playerAnswered && !isCorrect) playWrong();
    else playTimeUp();
  }, [playerAnswered, isCorrect]);

  // Polling fallback for finished detection
  useEffect(() => {
    if (!game?.id) return;
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('games')
          .select('status, phase')
          .eq('id', game.id)
          .single();
        if (data?.status === 'finished' || data?.phase === 'finished') {
          console.log('Finished detected by polling (round_result)!');
          clearInterval(pollInterval);
          navigate('final');
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 2000);
    const timeout = setTimeout(() => clearInterval(pollInterval), 30000);
    return () => { clearInterval(pollInterval); clearTimeout(timeout); };
  }, [game?.id, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex min-h-screen flex-col items-center justify-start px-6 pt-16 transition-colors duration-500
        ${!playerAnswered
          ? 'bg-background'
          : isCorrect
            ? 'bg-primary/5'
            : 'bg-destructive/5'
        }`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <motion.img
          src={resultImage}
          alt="result"
          key={!playerAnswered ? 'timeout' : isCorrect ? 'correct' : 'wrong'}
          className="h-36 w-36 object-contain"
          animate={
            !playerAnswered
              ? { y: [0, -8, 0, -8, 0], rotate: [-3, 3, -3, 3, 0] }
              : isCorrect
                ? { y: [0, -20, 0, -12, 0], scale: [1, 1.1, 1, 1.05, 1] }
                : { x: [-10, 10, -8, 8, -5, 5, 0], rotate: [-5, 5, -3, 3, 0] }
          }
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {!playerAnswered && (
          <>
            <h2 className="text-3xl font-black text-muted-foreground">
              {t('timesUp')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('didntAnswer')}
            </p>
          </>
        )}

        {playerAnswered && isCorrect && (
          <h2 className="text-3xl font-black text-primary">
            {t('correct')}
          </h2>
        )}

        {playerAnswered && !isCorrect && (
          <h2 className="text-3xl font-black text-destructive">
            {t('wrong')}
          </h2>
        )}

        {correctAnswerText && (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              {t('correctAnswer')}
            </p>
            <p className="mt-1 text-base font-black text-primary">
              {correctAnswerText}
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          {isLastQuestion ? t('gameEndingSoon') : t('leaderboardComingUp')}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RoundResult;
