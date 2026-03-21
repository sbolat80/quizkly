import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { TypewriterInput } from '@/components/ui/typewriter-input';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { playSelect } from '@/lib/sounds';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CodeStatus = 'idle' | 'checking' | 'valid' | 'not_found' | 'finished' | 'started';

const JoinScreen = ({ initialCode }: { initialCode?: string }) => {

  const { t } = useI18n();
  const setScreen = useGameStore((s) => s.setScreen);
  const loading = useGameStore((s) => s.loading);
  const { joinGame } = useGame();

  const [code, setCode] = useState(initialCode ?? '');
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [codeStatus, setCodeStatus] = useState<CodeStatus>(initialCode ? 'checking' : 'idle');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (code.length < 3) {
      setCodeStatus('idle');
      setLinkError(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setCodeStatus('checking');
      setLinkError(null);
      const { data, error } = await supabase
        .from('games')
        .select('status')
        .eq('game_code', code.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setCodeStatus('not_found');
        setLinkError(t('invalidLink'));
        return;
      }
      if (data.status === 'finished') {
        setCodeStatus('finished');
        setLinkError(t('gameEnded'));
      } else if (data.status === 'in_progress') {
        setCodeStatus('started');
        setLinkError(t('gameStarted'));
      } else {
        setCodeStatus('valid');
        setLinkError(null);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [code]);

  const hasError = codeStatus === 'not_found' || codeStatus === 'finished' || codeStatus === 'started';
  const canJoin = code.length >= 3 && nickname.trim() && codeStatus === 'valid' && !loading;

  const handleJoin = async () => {
    if (!canJoin) return;
    playSelect();
    const ok = await joinGame(code.toUpperCase(), nickname.trim(), avatarId);
    if (!ok) toast.error(t('couldNotJoin'));
  };

  const statusIcon = () => {
    switch (codeStatus) {
      case 'checking': return <span className="text-xs text-muted-foreground animate-pulse">{t('checkingRoom')}</span>;
      case 'valid': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'not_found': return <span className="flex items-center gap-1 text-xs text-destructive"><XCircle className="w-4 h-4" />{t('invalidLink')}</span>;
      case 'finished': return <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-4 h-4" />{t('gameEnded')}</span>;
      case 'started': return <span className="flex items-center gap-1 text-xs text-accent"><AlertCircle className="w-4 h-4" />{t('gameStarted')}</span>;
      default: return null;
    }
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
        {/* Back button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('home')}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 pt-2">
          {/* Title */}
          <h2 className="text-3xl font-black text-foreground text-center">
            {t('joinGame')}
          </h2>

          {/* Avatar */}
          <div className="space-y-2 text-center">
            <label className="text-sm font-bold text-muted-foreground">
              {t('chooseAvatar')}
            </label>
            <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
          </div>

          {/* Game code */}
          <div className="space-y-1.5 text-center">
            <label className="text-sm font-bold text-muted-foreground">
              {t('enterGameCode')}
            </label>
            <div className="relative">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                className="h-12 text-center text-2xl font-black tracking-[0.3em] uppercase rounded-xl bg-card/60 border-border"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {statusIcon()}
              </div>
            </div>
            {hasError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive font-medium"
              >
                {codeStatus === 'not_found' && t('invalidLink')}
                {codeStatus === 'finished' && t('gameEnded')}
                {codeStatus === 'started' && t('gameStarted')}
              </motion.div>
            )}
          </div>

          {/* Nickname */}
          <TypewriterInput
            placeholderText={t('enterNickname')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 16))}
            maxLength={16}
            className="h-12 text-center text-lg font-bold rounded-xl bg-card/60 border-border"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {/* Join button - sticky bottom */}
        <div className="sticky bottom-0 bg-background pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-extrabold rounded-2xl gap-2"
            disabled={!canJoin}
            onClick={handleJoin}
          >
            <LogIn className="w-5 h-5" />
            {loading ? t('checkingRoom') : t('joinRoom')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default JoinScreen;
