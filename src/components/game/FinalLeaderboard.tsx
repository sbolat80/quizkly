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

const medals = ['🥇', '🥈', '🥉'];

const FinalLeaderboard = () => {
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
  const podiumHeights: Record<number, string> = {
    0: 'h-28',
    1: 'h-20',
    2: 'h-16',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col items-center px-6 py-8"
    >
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
        {podiumOrder.map((rankIdx) => {
          const player = sorted[rankIdx];
          if (!player) return <div key={rankIdx} className="flex-1" />;

          const avatar = getAvatarById(avatarMap[player.id] ?? 1);
          const isMe = player.id === currentPlayer?.id;

          return (
            <motion.div
              key={player.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: rankIdx * 0.15, type: 'spring', stiffness: 180 }}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <motion.img
                src={avatar.image}
                alt={avatar.nameKey}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: rankIdx * 0.15 + 0.2 }}
                className={`object-contain ${rankIdx === 0 ? 'h-14 w-14' : 'h-10 w-10'}`}
              />
              <span className="text-lg">{medals[rankIdx]}</span>
              <p className={`text-center text-xs font-bold text-foreground truncate max-w-full ${isMe ? 'text-primary' : ''}`}>
                {player.nickname}
              </p>
              <p className="text-xs font-black text-primary">
                {player.score ?? 0} {t('pts')}
              </p>
              <div className={`w-full rounded-t-lg bg-primary/20 ${podiumHeights[rankIdx]}`} />
            </motion.div>
          );
        })}
      </div>

      {/* Full ranking */}
      <div className="mt-6 w-full max-w-sm flex flex-col gap-2">
        {sorted.map((player, i) => {
          const isMe = player.id === currentPlayer?.id;
          const avatar = getAvatarById(avatarMap[player.id] ?? 1);

          return (
            <motion.div
              key={player.id}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm ${
                isMe ? 'bg-primary/10 ring-2 ring-primary/40' : 'bg-card'
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

              <span className="text-base font-black text-primary">
                {player.score ?? 0}
              </span>
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
