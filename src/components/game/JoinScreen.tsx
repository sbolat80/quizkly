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

  // Validate code against Supabase
  useEffect(() => {
    if (code.length < 3) {
      setCodeStatus('idle');
      return;
    }
    const timeout = setTimeout(async () => {
      setCodeStatus('checking');
      const { data, error } = await supabase
        .from('games')
        .select('status')
        .eq('game_code', code.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setCodeStatus('not_found');
        return;
      }
      if (data.status === 'finished') {
        setCodeStatus('finished');
      } else if (data.status === 'in_progress') {
        setCodeStatus('started');
      } else {
        setCodeStatus('valid');
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
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col bg-ocean-dark"
    >
      <div className="w-full max-w-[428px] mx-auto flex flex-col flex-1 p-4 gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScreen('home')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-extrabold text-foreground">
            {t('joinGame')} 🌊
          </h2>
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-muted-foreground">
            {t('chooseAvatar')}
          </label>
          <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
        </div>

        {/* Game code */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-muted-foreground">
            {t('enterGameCode')}
          </label>
          <div className="relative">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              className="h-12 text-center text-2xl font-black tracking-[0.3em] uppercase bg-card/60 border-border"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {statusIcon()}
            </div>
          </div>
        </div>

        {/* Nickname */}
        <TypewriterInput
          placeholderText={t('enterNickname')}
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 16))}
          maxLength={16}
          className="h-12 text-center text-lg font-bold bg-card/60 border-border"
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />

        {/* Join button */}
        <Button
          size="lg"
          className="h-14 text-lg font-extrabold rounded-full gap-2 mt-auto mb-6"
          disabled={!canJoin}
          onClick={handleJoin}
        >
          <LogIn className="w-5 h-5" />
          {loading ? t('checkingRoom') : t('joinRoom')}
        </Button>
      </div>
    </motion.div>
  );
};

export default JoinScreen;
