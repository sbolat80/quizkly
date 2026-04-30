import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Trophy, Home } from 'lucide-react';
import { playGameOver } from '@/lib/sounds';
import { getAvatarById } from '@/data/avatars';
import { useCountUp } from '@/hooks/use-count-up';

const medals = ['🥇', '🥈', '🥉'];

/* ── Confetti canvas ── */
const ConfettiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{
    x: number; y: number; w: number; h: number;
    color: string; vx: number; vy: number; rot: number; vr: number; opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      'hsl(263,70%,58%)', 'hsl(330,80%,60%)', 'hsl(38,92%,50%)',
      'hsl(175,85%,42%)', 'hsl(217,91%,60%)', 'hsl(50,100%,55%)',
    ];

    // Burst confetti from the bottom of the screen, shooting upward then falling
    for (let i = 0; i < 140; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 20,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: -(8 + Math.random() * 8),
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 8,
        opacity: 0.9 + Math.random() * 0.1,
      });
    }

    const gravity = 0.35;
    const startTime = performance.now();
    const DURATION = 5000;

    let raf: number;
    const draw = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = elapsed > DURATION - 800 ? Math.max(0, (DURATION - elapsed) / 800) : 1;
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity * fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < DURATION) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
};

/* ── Animated score that counts from 0 ── */
const AnimatedScore = ({ score, delay, className, onDone }: {
  score: number; delay: number; className?: string; onDone?: () => void;
}) => {
  const animated = useCountUp(score ?? 0, 1200, delay);
  const doneRef = useRef(false);

  useEffect(() => {
    if (animated === score && score > 0 && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  }, [animated, score, onDone]);

  return <span className={className}>{animated}</span>;
};

/* ── Timing constants (ms) ── */
const PODIUM_RISE_DURATION = 800;
const SCORE_START_DELAY = PODIUM_RISE_DURATION + 200;
const SCORE_COUNT_DURATION = 1200;
const REVEAL_DELAY = SCORE_START_DELAY + SCORE_COUNT_DURATION + 300;

/* Podium heights by rank (1st/2nd/3rd) */
const PODIUM_PIXELS: Record<number, number> = { 1: 112, 2: 80, 3: 64 };

const FinalLeaderboard = () => {
  const { t } = useI18n();
  const { goHome } = useGame();
  const players = useGameStore((s) => s.players);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const avatarMap = useGameStore((s) => s.avatarMap);

  /* Normalize scores first so ties work even if values arrive as strings/null */
  const ranked = useMemo(() => {
    const normalized = players
      .map((player, index) => ({
        player,
        score: Number.isFinite(Number(player.score)) ? Number(player.score) : 0,
        index,
      }))
      .sort((a, b) => (b.score - a.score) || (a.index - b.index));

    let lastScore: number | null = null;
    let lastRank = 0;

    return normalized.map(({ player, score }, i) => {
      if (lastScore === null || score !== lastScore) {
        lastRank = i + 1;
        lastScore = score;
      }

      return { player, rank: lastRank, score };
    });
  }, [players]);

  const topScore = ranked[0]?.score ?? null;
  const isTieAtTop = topScore !== null && ranked.filter((r) => r.score === topScore).length > 1;
  const winner = isTieAtTop ? null : ranked[0]?.player ?? null;

  /* Group into podium positions (rank 1, 2, 3). Each group can hold multiple tied players. */
  const podiumGroups = useMemo(() => {
    const groups: Record<number, typeof ranked> = { 1: [], 2: [], 3: [] };
    ranked.forEach((r) => {
      if (r.rank <= 3) groups[r.rank].push(r);
    });
    return groups;
  }, [ranked]);

  /* Render order on screen: [rank 2, rank 1, rank 3] for visual podium */
  const podiumDisplayOrder: number[] = [2, 1, 3];

  const soundPlayed = useRef(false);
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    playGameOver();
  }, []);

  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), REVEAL_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col items-center px-6 py-8"
    >
      <ConfettiCanvas />

      {/* Title */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mt-4 text-center"
      >
        <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-2 text-3xl font-black text-foreground">{t('gameOver')}</h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          className="mt-1 text-base font-semibold text-muted-foreground"
        >
          {isTieAtTop
            ? `🤝 ${t('itsATie')}`
            : winner
              ? `🎉 ${t('congratulations').replace('{name}', winner.nickname)}`
              : ''}
        </motion.p>
      </motion.div>

      {/* Podium: groups of tied players share each podium step */}
      <div className="mt-8 flex items-end justify-center gap-3 w-full max-w-xs">
        {podiumDisplayOrder
          .filter((rank) => podiumGroups[rank] && podiumGroups[rank].length > 0)
          .map((rank) => {
          const group = podiumGroups[rank];
          const isFirst = rank === 1;
          const podiumHeight = PODIUM_PIXELS[rank];

          return (
            <div key={rank} className="flex w-24 flex-col items-center gap-1">
              {/* Row of tied players above the podium (side-by-side) */}
              <div className="flex items-end justify-center gap-2">
                {group.map(({ player }) => {
                  const avatar = getAvatarById(player.avatar_id ?? avatarMap[player.id] ?? 1);
                  const isMe = player.id === currentPlayer?.id;
                  // Don't show crown if 1st place is tied
                  const showCrown = isFirst && !isTieAtTop;

                  return (
                    <AnimatePresence key={player.id} mode="wait">
                      {revealed ? (
                        <motion.div
                          key="avatar"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          {showCrown && (
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                              className="text-xl leading-none"
                            >
                              👑
                            </motion.span>
                          )}
                          {!showCrown && isFirst && <span className="text-xl leading-none opacity-0">👑</span>}
                          <motion.img
                            src={avatar.image}
                            alt={avatar.nameKey}
                            className={`object-contain rounded-full ${
                              isFirst ? 'h-14 w-14' : 'h-10 w-10'
                            }`}
                            animate={showCrown ? { scale: [1, 1.05, 1] } : {}}
                            transition={showCrown ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
                          />
                          <p className={`text-center text-xs font-bold truncate max-w-[70px] ${isMe ? 'text-primary' : 'text-foreground'}`}>
                            {player.nickname}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div key="placeholder" className="flex flex-col items-center gap-0.5">
                          {isFirst && <span className="text-xl leading-none opacity-0">👑</span>}
                          <div className={`rounded-full bg-muted ${isFirst ? 'h-14 w-14' : 'h-10 w-10'}`} />
                          <div className="h-3 w-12 rounded bg-muted" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>

              <span className="text-lg">{medals[rank - 1]}</span>

              {/* Score (use first in group — they're tied so all the same) */}
              <AnimatedScore
                score={group[0].player.score ?? 0}
                delay={SCORE_START_DELAY + (rank - 1) * 150}
                className="text-xs font-black text-primary"
              />

              {/* Podium bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: podiumHeight }}
                transition={{ duration: PODIUM_RISE_DURATION / 1000, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-full rounded-t-lg bg-primary/20"
              />
            </div>
          );
        })}
      </div>

      {/* Full ranking (uses dense rank: tied players show same medal/number) */}
      <div className="mt-6 w-full max-w-sm flex flex-col gap-2">
        {ranked.map(({ player, rank }, i) => {
          const isMe = player.id === currentPlayer?.id;
          const avatar = getAvatarById(player.avatar_id ?? avatarMap[player.id] ?? 1);
          const rowDelay = 0.4 + i * 0.08;

          return (
            <motion.div
              key={player.id}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: rowDelay, type: 'spring', stiffness: 260, damping: 20 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm ${
                isMe ? 'bg-primary/15 ring-2 ring-primary/50' : 'bg-card'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                {rank <= 3 ? medals[rank - 1] : rank}
              </span>

              <AnimatePresence mode="wait">
                {revealed ? (
                  <motion.img
                    key="av"
                    src={avatar.image}
                    alt={avatar.nameKey}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="h-8 w-8 rounded-full object-contain"
                  />
                ) : (
                  <div key="ph" className="h-8 w-8 rounded-full bg-muted" />
                )}
              </AnimatePresence>

              <span className="flex-1">
                <AnimatePresence mode="wait">
                  {revealed ? (
                    <motion.span
                      key="name"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="text-base font-bold text-card-foreground"
                    >
                      {player.nickname}
                      {isMe && (
                        <span className="ml-2 text-xs font-semibold text-muted-foreground">
                          ({t('you')})
                        </span>
                      )}
                    </motion.span>
                  ) : (
                    <div key="ph" className="h-4 w-20 rounded bg-muted" />
                  )}
                </AnimatePresence>
              </span>

              <AnimatedScore
                score={player.score ?? 0}
                delay={rowDelay * 1000 + SCORE_START_DELAY}
                className="text-base font-black text-primary"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex w-full max-w-sm flex-col gap-3 pt-6 pb-4">
        <Button onClick={goHome} variant="outline" size="lg" className="w-full gap-2">
          <Home className="h-5 w-5" />
          {t('newGame')}
        </Button>
      </div>
    </motion.div>
  );
};

export default FinalLeaderboard;
