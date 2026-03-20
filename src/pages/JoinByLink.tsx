import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { I18nProvider } from '@/i18n';
import { GameProvider } from '@/context/GameContext';
import GameShell from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';

const JoinByLinkInner = () => {
  const { code } = useParams();
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    if (code) setScreen('join');
  }, [code, setScreen]);

  return <GameShell initialCode={code} />;
};

const JoinByLink = () => (
  <I18nProvider>
    <GameProvider>
      <JoinByLinkInner />
    </GameProvider>
  </I18nProvider>
);

export default JoinByLink;
