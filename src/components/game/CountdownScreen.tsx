import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { useI18n } from '@/i18n';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { playCountdownTick, playCountdownGo } from '@/lib/sounds';

const CountdownScreen = () => {
  useLockBodyScroll();
  const { t } = useI18n();
  const { navigate } = useGame();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      playCountdownTick();
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      playCountdownGo();
      const timer = setTimeout(() => navigate('question'), 500);
      return () => clearTimeout(timer);
    }
  }, [count, navigate]);

  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-background px-4"
    >
      <p className="text-lg font-bold text-muted-foreground mb-8">
        {t('getReady')}
      </p>

      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-9xl font-black text-primary"
        >
          {count > 0 ? count : t('goExclamation')}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};

export default CountdownScreen;
