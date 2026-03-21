import type { TranslationKeys } from '@/i18n/en';

import monster1 from '@/assets/avatars/monster-1.png';
import monster2 from '@/assets/avatars/monster-2.png';
import monster3 from '@/assets/avatars/monster-3.png';
import monster4 from '@/assets/avatars/monster-4.png';
import monster5 from '@/assets/avatars/monster-5.png';
import monster6 from '@/assets/avatars/monster-6.png';
import monster7 from '@/assets/avatars/monster-7.png';
import monster8 from '@/assets/avatars/monster-8.png';

export interface AvatarData {
  id: number;
  nameKey: TranslationKeys;
  image: string;
  color: string;
}

export const avatars: AvatarData[] = [
  { id: 1, nameKey: 'avatar1', image: monster1, color: '#EF4444' },
  { id: 2, nameKey: 'avatar2', image: monster2, color: '#EAB308' },
  { id: 3, nameKey: 'avatar3', image: monster3, color: '#F97316' },
  { id: 4, nameKey: 'avatar4', image: monster4, color: '#22C55E' },
  { id: 5, nameKey: 'avatar5', image: monster5, color: '#0D9488' },
  { id: 6, nameKey: 'avatar6', image: monster6, color: '#3B82F6' },
  { id: 7, nameKey: 'avatar7', image: monster7, color: '#8B5CF6' },
  { id: 8, nameKey: 'avatar8', image: monster8, color: '#EC4899' },
];

export function getAvatarById(id: number): AvatarData {
  return avatars.find((a) => a.id === id) ?? avatars[0];
}