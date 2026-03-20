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
            {t('createGame')}
          </h2>

          {/* Question Language */}
          <div className="space-y-2 text-center">
            <label className="text-sm font-bold text-muted-foreground">
              {t('questionLanguage')}
            </label>
            <div className="flex gap-2 justify-center">
              {(['en', 'tr'] as const).map((l) => (
                <Button
                  key={l}
                  variant={questionLang === l ? 'default' : 'outline'}
                  size="sm"
                  className={`font-bold gap-1.5 rounded-full px-5 ${
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
          <div className="space-y-2 text-center">
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
            className="h-12 text-center text-lg font-bold rounded-xl bg-card/60 border-border"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>

        {/* Create button - sticky bottom */}
        <div className="sticky bottom-0 bg-background pt-3 pb-4">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-extrabold rounded-2xl gap-2"
            disabled={!nickname.trim() || loading}
            onClick={handleCreate}
          >
            <Sparkles className="w-5 h-5" />
            {loading ? t('starting') : t('createRoom')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateScreen;
