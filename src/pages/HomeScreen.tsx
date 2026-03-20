import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

const HomeScreen = () => {
  const { t, lang, setLang } = useI18n();

  const toggleLang = () => setLang(lang === 'en' ? 'tr' : 'en');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ocean-dark relative overflow-hidden">
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/10 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
      >
        <Globe className="w-4 h-4" />
        {lang.toUpperCase()}
      </button>

      {/* Title */}
      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-7xl md:text-9xl font-black text-primary text-glow-primary tracking-tight"
      >
        Inkzy
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-lg text-muted-foreground font-bold"
      >
        {t('tagline')}
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex flex-col gap-4 w-64"
      >
        <Button size="lg" className="text-lg font-extrabold h-14">
          {t('createGame')}
        </Button>
        <Button size="lg" variant="secondary" className="text-lg font-extrabold h-14">
          {t('joinGame')}
        </Button>
      </motion.div>
    </div>
  );
};

export default HomeScreen;
