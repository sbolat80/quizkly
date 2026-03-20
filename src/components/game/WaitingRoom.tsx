import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Share2, Play, Crown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { avatars } from '@/data/avatars';
import { getSessionId } from '@/lib/session';
import { playPlayerJoin } from '@/lib/sounds';
import { toast } from 'sonner';

const WaitingRoom = () => {
  const { t } = useI18n();
  const { goHome, startGame } = useGame();
  const game = useGameStore((s) => s.game);
  const players = useGameStore((s) => s.players);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const loading = useGameStore((s) => s.loading);

  const prevCountRef = useRef(players.length);
  const sessionId = getSessionId();

  const isHost = currentPlayer?.is_host === true;
  const gameCode = game?.game_code ?? '';
  const joinUrl = `${window.location.origin}/join/${gameCode}`;

  // Play sound when a new player joins
  useEffect(() => {
    if (players.length > prevCountRef.current) {
      playPlayerJoin();
    }
    prevCountRef.current = players.length;
  }, [players.length]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      toast.success(t('codeCopied'));
    } catch {
      toast.success(t('codeCopied'));
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Quizkly', text: `Join my game!`, url: joinUrl });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(joinUrl);
      toast.success(t('joinLinkCopied'));
    }
  };

  const getAvatarImage = (avatarId: number) => {
    return avatars.find((a) => a.id === avatarId)?.image ?? avatars[0].image;
  };

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col bg-background pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
    >
      <div className="w-full max-w-[428px] mx-auto flex flex-col flex-1 px-4 pt-4">
        {/* Back / Leave button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={goHome}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('leave')}
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-5 pt-2 pb-4">
          {/* Game Code Section */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('gameCode')}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary text-primary-foreground transition-transform active:scale-95"
            >
              <span className="text-3xl font-black tracking-[0.25em]">{gameCode}</span>
              <Copy className="w-5 h-5 opacity-70" />
            </button>
            <span className="text-xs text-muted-foreground">{t('tapToCopy')}</span>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCodeSVG value={joinUrl} size={100} />
            </div>
            <span className="text-xs text-muted-foreground">{t('scanToJoin')}</span>
          </div>

          {/* Share Link Button */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 border-primary/30 text-primary"
            onClick={shareLink}
          >
            <Share2 className="w-4 h-4" />
            {t('shareJoinLink')}
          </Button>

          {/* Players List */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {t('players')} ({players.length})
              </h3>
              {game?.language && (
                <span className="text-xs text-muted-foreground">
                  {game.language === 'tr' ? '🇹🇷' : '🇬🇧'}{' '}
                  {game.language === 'tr' ? t('langTurkish') : t('langEnglish')}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {players.map((player, index) => {
                  const isSelf = player.session_id === sessionId;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -30, opacity: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                    >
                      <img
                        src={getAvatarImage(player.avatar_id ?? 1)}
                        alt={player.nickname}
                        className="h-10 w-10 rounded-full object-contain bg-muted/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground truncate">
                            {player.nickname}
                          </span>
                          {isSelf && (
                            <span className="text-xs text-primary font-bold">
                              ({t('you')})
                            </span>
                          )}
                        </div>
                      </div>
                      {player.is_host && (
                        <div className="flex items-center gap-1 text-xs font-bold text-accent">
                          <Crown className="w-4 h-4" />
                          {t('host')}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="sticky bottom-0 bg-background pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isHost ? (
            <Button
              size="lg"
              className="w-full h-14 text-lg font-extrabold rounded-2xl gap-2 animate-pulse"
              disabled={players.length < 2 || loading}
              onClick={startGame}
            >
              <Play className="w-5 h-5" />
              {loading ? t('starting') : t('startGame')}
            </Button>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm font-bold text-muted-foreground py-4"
            >
              ⏳ {t('waitingForHost')}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WaitingRoom;
