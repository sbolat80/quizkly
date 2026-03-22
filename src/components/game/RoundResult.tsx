import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useI18n } from '@/i18n';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { playCorrect, playWrong, playTimeUp } from '@/lib/sounds';
import { getAvatarById } from '@/data/avatars';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/context/GameContext';

const RoundResult = () => {
  const { t } = useI18n();
  const { navigate } = useGame();
  const game = useGameStore((s) => s.game);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const avatarMap = useGameStore((s) => s.avatarMap);

  const playerAnswered = currentPlayer?.currentAnswer != null;
  const isCorrect = currentPlayer?.lastWasCorrect === true;
  const resolvedIdx = currentPlayer?.lastCorrectIndex;
  const question = questions[currentQuestionIndex];
  const correctAnswerText =
    resolvedIdx != null && question?.options
      ? question.options[resolvedIdx]
      : null;

  const avatarId = avatarMap[currentPlayer?.id] ?? 1;
  const avatar = getAvatarById(avatarId);

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

  const avatarAnimate = playerAnswered
    ? isCorrect
      ? { y: [0, -20, 0, -10, 0] }
      : { x: [-10, 10, -8, 8, 0] }
    : { rotate: [-5, 5, -3, 3, 0] };

  const avatarTransition = playerAnswered
    ? isCorrect
      ? { duration: 0.6 }
      : { duration: 0.5 }
    : { duration: 0.4 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col items-center justify-start px-6 pt-16"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <motion.img
          src={avatar.image}
          alt={avatar.nameKey}
          animate={avatarAnimate}
          transition={avatarTransition}
          className="h-24 w-24 object-contain"
        />

        {!playerAnswered && (
          <>
            <Clock className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-3xl font-black text-muted-foreground">
              {t('timesUp')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('didntAnswer')}
            </p>
          </>
        )}

        {playerAnswered && isCorrect && (
          <>
            <CheckCircle className="h-10 w-10 text-green-500" />
            <h2 className="text-3xl font-black text-green-500">
              {t('correct')}
            </h2>
          </>
        )}

        {playerAnswered && !isCorrect && (
          <>
            <XCircle className="h-10 w-10 text-destructive" />
            <h2 className="text-3xl font-black text-destructive">
              {t('wrong')}
            </h2>
          </>
        )}

        {correctAnswerText && (
          <p className="mt-1 text-base font-semibold text-muted-foreground">
            {t('correctAnswer')}{' '}
            <span className="font-black text-foreground">
              {correctAnswerText}
            </span>
          </p>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          {t('leaderboardComingUp')}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RoundResult;
