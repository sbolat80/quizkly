import { motion } from 'framer-motion';
import { avatars } from '@/data/avatars';
import { useI18n } from '@/i18n';
import { playAvatarSelect } from '@/lib/sounds';

interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
}

const idleAnimation = {
  y: [0, -4, 0],
  transition: {
    duration: 2.4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const selectedAnimation = {
  scale: [1, 1.15, 1],
  rotate: [0, -6, 6, 0],
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-4 gap-2">
      {avatars.map((av, i) => {
        const isSelected = selected === av.id;
        return (
          <motion.button
            key={av.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              onSelect(av.id);
              playAvatarSelect(av.id);
            }}
            className={`flex flex-col items-center gap-1 rounded-2xl p-2 transition-colors ${
              isSelected
                ? 'ring-2 ring-primary bg-primary/10'
                : 'bg-card/60 hover:bg-card/80'
            }`}
          >
            <motion.img
              src={av.image}
              alt={t(av.nameKey)}
              className="h-16 w-16 object-contain"
              animate={isSelected ? selectedAnimation : idleAnimation}
            />
            <span className={`text-xs font-bold truncate w-full text-center ${
              isSelected ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {t(av.nameKey)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
