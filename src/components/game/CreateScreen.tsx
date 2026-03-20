import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { TypewriterInput } from '@/components/ui/typewriter-input';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/context/GameContext';
import { playSelect } from '@/lib/sounds';

const CreateScreen = () => {
  const { t } = useI18n();
  const setScreen = useGameStore((s) => s.setScreen);
  const loading = useGameStore((s) => s.loading);
  const { createGame } = useGame();

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [questionLang, setQuestionLang] = useState<'en' | 'tr'>('en');

  const handleCreate = async () => {
    if (!nickname.trim()) return;
    playSelect();
    await createGame(nickname.trim(), avatarId, questionLang);
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
            {t('createGame')} 🎮
          </h2>
        </div>

        {/* Question Language */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-muted-foreground">
            {t('questionLanguage')}
          </label>
          <div className="flex gap-2">
            {(['en', 'tr'] as const).map((l) => (
              <Button
                key={l}
                variant={questionLang === l ? 'default' : 'outline'}
                size="sm"
                className={`font-bold gap-1.5 ${
                  questionLang !== l ? 'border-primary/30 text-muted-foreground' : ''
                }`}
                onClick={() => setQuestionLang(l)}
              >
                {l === 'en' ? '🇬🇧 EN' : '🇹🇷 TR'}
              </Button>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-muted-foreground">
            {t('chooseAvatar')}
          </label>
          <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
        </div>

        {/* Nickname */}
        <TypewriterInput
          placeholderText={t('enterNickname')}
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 16))}
          maxLength={16}
          className="h-12 text-center text-lg font-bold bg-card/60 border-border"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />

        {/* Create button */}
        <Button
          size="lg"
          className="h-14 text-lg font-extrabold rounded-full gap-2 mt-auto mb-6"
          disabled={!nickname.trim() || loading}
          onClick={handleCreate}
        >
          <Sparkles className="w-5 h-5" />
          {loading ? t('starting') : t('createRoom')}
        </Button>
      </div>
    </motion.div>
  );
};

export default CreateScreen;
