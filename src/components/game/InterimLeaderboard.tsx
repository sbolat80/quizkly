import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useI18n } from '@/i18n';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { playLeaderboard } from '@/lib/sounds';
import { getAvatarById } from '@/data/avatars';
import { useCountUp } from '@/hooks/use-count-up';

const medals = ['🥇', '🥈', '🥉'];

const AnimatedScore = ({ score, delay }: { score: number; delay: number }) => {
  const animated = useCountUp(score ?? 0, 1200, delay);
  return <span className="text-base font-black text-primary">{animated}</span>;
};

const InterimLeaderboard = () => {
  useLockBodyScroll();
  const { t } = useI18n();
  const game = useGameStore((s) => s.game);
  const players = useGameStore((s) => s.players);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const avatarMap = useGameStore((s) => s.avatarMap);

  const sorted = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex + 1 >= totalQuestions;

  const soundPlayed = useRef(false);
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    playLeaderboard();
  }, []);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col items-center px-6 py-8"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-6 text-center"
      >
        <h2 className="text-3xl font-black text-foreground">
          {t('leaderboard')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('question')} {currentQuestionIndex + 1} / {totalQuestions}
        </p>
      </motion.div>

      <div className="mt-8 w-full max-w-sm flex flex-col gap-2">
        {sorted.map((player, i) => {
          const isMe = player.id === currentPlayer?.id;
          const avatar = getAvatarById(avatarMap[player.id] ?? 1);
          const staggerDelay = i * 0.08;

          return (
            <motion.div
              key={player.id}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: staggerDelay, type: 'spring', stiffness: 260, damping: 20 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm ${
                isMe
                  ? 'bg-primary/10 ring-2 ring-primary/40'
                  : 'bg-card'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                {i < 3 ? medals[i] : i + 1}
              </span>

              <motion.img
                src={avatar.image}
                alt={avatar.nameKey}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: staggerDelay + 0.15 }}
                className="h-8 w-8 rounded-full object-contain"
              />

              <span className="flex-1 text-base font-bold text-card-foreground">
                {player.nickname}
                {isMe && (
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">
                    {t('you')}
                  </span>
                )}
              </span>

              <AnimatedScore score={player.score ?? 0} delay={staggerDelay * 1000 + 300} />
            </motion.div>
          );
        })}
      </div>

      <p className="mt-auto pb-4 text-sm text-muted-foreground">
        {isLastQuestion ? t('gameEndingSoon') : t('nextQuestionComing')}
      </p>
    </motion.div>
  );
};

export default InterimLeaderboard;
