import { motion } from 'framer-motion';
import { Globe, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/stores/gameStore';

const HomeScreen = () => {
  const { t, lang, setLang } = useI18n();
  const setScreen = useGameStore((s) => s.setScreen);

  const toggleLang = () => setLang(lang === 'en' ? 'tr' : 'en');

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col items-center justify-center bg-ocean-dark relative overflow-hidden"
    >
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/10 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
      >
        <Globe className="w-4 h-4" />
        {lang === 'en' ? '🇬🇧' : '🇹🇷'} {lang.toUpperCase()}
      </button>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
          <span className="text-primary text-glow-primary">Ink</span>
          <span style={{ color: '#EC4899' }}>zy</span>
        </h1>
        <span className="text-5xl mt-2">🦑</span>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-3 text-base text-muted-foreground font-bold"
      >
        {t('tagline')}
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-10 flex flex-col gap-3 w-full max-w-[280px]"
      >
        <Button
          size="lg"
          className="text-lg font-extrabold h-14 rounded-full gap-2"
          onClick={() => setScreen('create')}
        >
          <Zap className="w-5 h-5" />
          {t('createGame')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="text-lg font-extrabold h-14 rounded-full gap-2 border-primary text-primary hover:bg-primary/10"
          onClick={() => setScreen('join')}
        >
          <Users className="w-5 h-5" />
          {t('joinGame')}
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute bottom-6 text-xs text-muted-foreground/50 font-bold"
      >
        🦑 inkzy.gg
      </motion.p>
    </motion.div>
  );
};

export default HomeScreen;
