import { motion } from 'framer-motion';
import { avatars } from '@/data/avatars';
import { useI18n } from '@/i18n';
import { playAvatarSelect } from '@/lib/sounds';

interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
}

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
            className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-colors ${
              isSelected
                ? 'ring-2 ring-primary bg-primary/10'
                : 'bg-card/60 hover:bg-card/80'
            }`}
          >
            <span className="text-4xl leading-none">{av.emoji}</span>
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
