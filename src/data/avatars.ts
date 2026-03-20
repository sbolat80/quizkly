import type { TranslationKeys } from '@/i18n/en';

export interface AvatarData {
  id: number;
  nameKey: TranslationKeys;
  emoji: string;
  color: string;
}

export const avatars: AvatarData[] = [
  { id: 1, nameKey: 'avatar1', emoji: '🦑', color: '#EC4899' },
  { id: 2, nameKey: 'avatar2', emoji: '🐙', color: '#F59E0B' },
  { id: 3, nameKey: 'avatar3', emoji: '🐡', color: '#EAB308' },
  { id: 4, nameKey: 'avatar4', emoji: '🦈', color: '#3B82F6' },
  { id: 5, nameKey: 'avatar5', emoji: '🐠', color: '#F97316' },
  { id: 6, nameKey: 'avatar6', emoji: '⭐', color: '#8B5CF6' },
  { id: 7, nameKey: 'avatar7', emoji: '🐟', color: '#EF4444' },
  { id: 8, nameKey: 'avatar8', emoji: '🐡', color: '#FDA4AF' },
];
