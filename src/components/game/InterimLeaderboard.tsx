import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useI18n } from '@/i18n';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { playLeaderboard } from '@/lib/sounds';
import { getAvatarById } from '@/data/avatars';
import { useCountUp } from '@/hooks/use-count-up';

const medals = ['🥇', '🥈', '🥉'];

// Per-row timing (ms) measured from row mount
const CHIP_IN_MS = 300;
const COUNT_START_MS = 600;
const COUNT_DURATION_MS = 1000;
const CHIP_OUT_MS = COUNT_START_MS + COUNT_DURATION_MS; // 1600
const REORDER_MS = CHIP_OUT_MS + 300; // 1900

const AnimatedScore = ({
  from,
  to,
  earned,
  rowDelayMs,
}: {
  from: number;
  to: number;
  earned: number;
  rowDelayMs: number;
}) => {
  const animated = useCountUp(to, COUNT_DURATION_MS, rowDelayMs + COUNT_START_MS, from);
  const [showChip, setShowChip] = useState(false);

  useEffect(() => {
    if (earned <= 0) return;
    const tIn = setTimeout(() => setShowChip(true), rowDelayMs + CHIP_IN_MS);
    const tOut = setTimeout(() => setShowChip(false), rowDelayMs + CHIP_OUT_MS);
    return () => {
      clearTimeout(tIn);
      clearTimeout(tOut);
    };
  }, [earned, rowDelayMs]);

  return (
    <span className="flex items-center gap-2">
      <span className="text-base font-black text-primary tabular-nums">{animated}</span>
      <AnimatePresence>
        {showChip && earned > 0 && (
          <motion.span
            key="chip"
            initial={{ opacity: 0, scale: 0.6, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-black text-accent-foreground ring-1 ring-accent/40"
          >
            +{earned}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

const InterimLeaderboard = () => {
  useLockBodyScroll();
  const { t } = useI18n();
  const players = useGameStore((s) => s.players);
  const previousScores = useGameStore((s) => s.previousScores);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const questions = useGameStore((s) => s.questions);
  const currentQuestionIndex = useGameStore((s) => s.currentQuestionIndex);
  const avatarMap = useGameStore((s) => s.avatarMap);

  // Snapshot previous scores once on mount so realtime updates that arrive
  // mid-animation cannot retroactively change "from" values.
  const prevScoresRef = useRef<Record<string, number>>({});
  if (Object.keys(prevScoresRef.current).length === 0) {
    prevScoresRef.current = { ...previousScores };
  }
  const getPrev = (id: string) => prevScoresRef.current[id] ?? 0;

  const totalQuestions = questions.length;
  const isNextQuestionLast = currentQuestionIndex + 2 >= totalQuestions;

  const [useNewOrder, setUseNewOrder] = useState(false);

  const sorted = useMemo(() => {
    const list = [...players];
    if (useNewOrder) {
      list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else {
      list.sort((a, b) => getPrev(b.id) - getPrev(a.id));
    }
    return list;
  }, [players, useNewOrder]);

  const soundPlayed = useRef(false);
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    playLeaderboard();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setUseNewOrder(true), REORDER_MS);
    return () => clearTimeout(t);
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

      <motion.div layout className="mt-8 w-full max-w-sm flex flex-col gap-2">
        {sorted.map((player, i) => {
          const isMe = player.id === currentPlayer?.id;
          const avatar = getAvatarById(player.avatar_id ?? avatarMap[player.id] ?? 1);
          const rowDelayMs = i * 80;
          const prev = getPrev(player.id);
          const newScore = player.score ?? 0;
          const earned = Math.max(0, newScore - prev);

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                layout: { type: 'spring', stiffness: 320, damping: 28 },
                default: { delay: rowDelayMs / 1000, type: 'spring', stiffness: 260, damping: 20 },
              }}
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
                transition={{ type: 'spring', delay: rowDelayMs / 1000 + 0.15 }}
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

              <AnimatedScore
                from={prev}
                to={newScore}
                earned={earned}
                rowDelayMs={rowDelayMs}
              />
            </motion.div>
          );
        })}
      </motion.div>

      <p className="mt-6 pb-4 text-sm text-muted-foreground">
        {isNextQuestionLast ? t('gameEndingSoon') : t('nextQuestionComing')}
      </p>
    </motion.div>
  );
};

export default InterimLeaderboard;
