import { useEffect, useState, useCallback } from 'react';
import { isSoundMuted, toggleSoundMuted, subscribeSoundMuted } from '@/lib/sounds';

/**
 * Subscribe to global sound-mute state.
 * Backed by localStorage and shared across the app.
 */
export function useSoundMute() {
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  useEffect(() => subscribeSoundMuted(setMuted), []);

  const toggle = useCallback(() => {
    toggleSoundMuted();
  }, []);

  return { muted, toggle };
}
