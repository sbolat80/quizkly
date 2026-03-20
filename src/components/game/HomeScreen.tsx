import { motion } from 'framer-motion';
import { Globe, Zap, Users, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/stores/gameStore';
import { useTheme } from '@/hooks/use-theme';
import QuizklyLogo from '@/assets/quizkly-logo.svg';

const HomeScreen = () => {
  const { t, lang, setLang } = useI18n();
  const setScreen = useGameStore((s) => s.setScreen);
  const { theme, toggleTheme } = useTheme();

  const toggleLang = () => setLang(lang === 'en' ? 'tr' : 'en');

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-6"
    >
      {/* Top-right controls */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center rounded-full px-3 py-1.5 backdrop-blur-sm border transition-all duration-200 hover:brightness-110 bg-black/[0.06] border-black/[0.12] dark:bg-white/10 dark:border-white/20">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-white/70" />
            ) : (
              <Moon className="w-4 h-4" style={{ color: '#4C1D95' }} />
            )}
          </button>
          <div className="w-px h-4 mx-2 bg-black/[0.12] dark:bg-white/20" />
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-bold transition-colors text-foreground/70 hover:text-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? '🇬🇧' : '🇹🇷'} {lang.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
        transition={{
          scale: { type: 'spring', stiffness: 200, damping: 15 },
          opacity: { type: 'spring', stiffness: 200, damping: 15 },
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="flex flex-col items-center pt-8"
      >
        <img
          src={QuizklyLogo}
          alt="Quizkly"
          className="h-48 w-auto object-contain"
        />
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-8 text-base font-bold text-center whitespace-pre-line leading-relaxed text-[#3B0764] dark:text-white/60"
      >
        {t('tagline')}
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-8 flex flex-col gap-3 w-full max-w-[280px]"
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
        className="absolute bottom-6 text-xs font-bold text-[#6D28D9] dark:text-white/40"
      >
        🎮 quizkly.gg
      </motion.p>
    </motion.div>
  );
};

export default HomeScreen;
