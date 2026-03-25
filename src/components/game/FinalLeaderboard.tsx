import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { useI18n } from '@/i18n';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { playGameOver } from '@/lib/sounds';
import { getAvatarById } from '@/data/avatars';
import { useCountUp } from '@/hooks/use-count-up';
import Confetti from './Confetti';

const medals = ['🥇', '🥈', '🥉'];

const AnimatedScore = ({ score, delay, className }: { score: number; delay: number; className?: string }) => {
  const animated = useCountUp(score ?? 0, 1200, delay);
  return <span className={className}>{animated}</span>;
};

const FinalLeaderboard = () => {
  useLockBodyScroll();
  const { t } = useI18n();
  const { goHome, playAgain } = useGame();
  const players = useGameStore((s) => s.players);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const avatarMap = useGameStore((s) => s.avatarMap);

  const sorted = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sorted[0];

  const soundPlayed = useRef(false);
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    playGameOver();
  }, []);

  // Podium order: [2nd, 1st, 3rd]
  const podiumOrder = [1, 0, 2];
  const podiumHeights: Record<number, number> = {
    0: 112, // 1st place
    1: 80,  // 2nd place
    2: 64,  // 3rd place
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col items-center px-6 py-8"
    >
      <Confetti />

      {/* Title */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mt-4 text-center"
      >
        <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-2 text-3xl font-black text-foreground">
          {t('gameOver')}
        </h2>
        {winner && (
          <p className="mt-1 text-base font-semibold text-muted-foreground">
            🎉 {t('congratulations').replace('{name}', winner.nickname)}
          </p>
        )}
      </motion.div>

      {/* Podium */}
      <div className="mt-8 flex items-end justify-center gap-3 w-full max-w-xs">
        {podiumOrder.map((rankIdx, visualIdx) => {
          const player = sorted[rankIdx];
          if (!player) return <div key={rankIdx} className="flex-1" />;

          const avatar = getAvatarById(avatarMap[player.id] ?? 1);
          const isMe = player.id === currentPlayer?.id;
          const isFirst = rankIdx === 0;
          const avatarDelay = 0.3 + visualIdx * 0.15;
          const barDelay = 0.6 + visualIdx * 0.15;

          return (
            <div key={player.id} className="flex flex-1 flex-col items-center gap-1">
              {/* Crown for 1st */}
              {isFirst && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: [0, -4, 0] }}
                  transition={{
                    opacity: { delay: avatarDelay - 0.1, duration: 0.3 },
                    y: { delay: avatarDelay + 0.3, duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="text-2xl"
                >
                  👑
                </motion.span>
              )}

              {/* Avatar */}
              <motion.img
                src={avatar.image}
                alt={avatar.nameKey}
                initial={{ y: -30, opacity: 0 }}
                animate={isFirst
                  ? { y: 0, opacity: 1, scale: [1, 1.08, 1] }
                  : { y: 0, opacity: 1 }
                }
                transition={isFirst
                  ? {
                      y: { delay: avatarDelay, type: 'spring', stiffness: 180 },
                      opacity: { delay: avatarDelay, duration: 0.3 },
                      scale: { delay: avatarDelay + 0.5, duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                    }
                  : { delay: avatarDelay, type: 'spring', stiffness: 180 }
                }
                className={`object-contain ${
                  isFirst
                    ? 'h-16 w-16 rounded-full border-[3px] border-yellow-400 shadow-lg shadow-yellow-400/30'
                    : 'h-10 w-10'
                }`}
              />

              <span className="text-lg">{medals[rankIdx]}</span>
              <p className={`text-center text-xs font-bold truncate max-w-full ${isMe ? 'text-primary' : 'text-foreground'}`}>
                {player.nickname}
              </p>
              <AnimatedScore
                score={player.score ?? 0}
                delay={barDelay * 1000 + 200}
                className="text-xs font-black text-primary"
              />

              {/* Podium bar - grows from bottom */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: barDelay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: podiumHeights[rankIdx], transformOrigin: 'bottom' }}
                className="w-full rounded-t-lg bg-primary/20"
              />
            </div>
          );
        })}
      </div>

      {/* Full ranking */}
      <div className="mt-6 w-full max-w-sm flex flex-col gap-2">
        {sorted.map((player, i) => {
          const isMe = player.id === currentPlayer?.id;
          const avatar = getAvatarById(avatarMap[player.id] ?? 1);
          const staggerDelay = 0.8 + i * 0.18;

          return (
            <motion.div
              key={player.id}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: staggerDelay, type: 'spring', stiffness: 200, damping: 22 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm ${
                isMe
                  ? 'bg-accent/60 ring-2 ring-primary/50'
                  : 'bg-card'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                {i < 3 ? medals[i] : i + 1}
              </span>

              <img
                src={avatar.image}
                alt={avatar.nameKey}
                className="h-8 w-8 rounded-full object-contain"
              />

              <span className="flex-1 text-base font-bold text-card-foreground">
                {player.nickname}
                {isMe && (
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">
                    ({t('you')})
                  </span>
                )}
              </span>

              <AnimatedScore
                score={player.score ?? 0}
                delay={staggerDelay * 1000 + 300}
                className="text-base font-black text-primary"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex w-full max-w-sm flex-col gap-3 pt-6 pb-4">
        {currentPlayer?.is_host && (
          <Button onClick={playAgain} size="lg" className="w-full gap-2">
            <RotateCcw className="h-5 w-5" />
            {t('playAgain')}
          </Button>
        )}
        <Button onClick={goHome} variant="outline" size="lg" className="w-full gap-2">
          <Home className="h-5 w-5" />
          {t('newGame')}
        </Button>
      </div>
    </motion.div>
  );
};

export default FinalLeaderboard;
