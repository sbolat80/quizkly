import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import HomeScreen from './HomeScreen';
import CreateScreen from './CreateScreen';
import JoinScreen from './JoinScreen';
import WaitingRoom from './WaitingRoom';

const PlaceholderScreen = ({ name }: { name: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-bold">
    {name}
  </div>
);

interface GameShellProps {
  initialCode?: string;
}

const GameShell = ({ initialCode }: GameShellProps) => {
  const screen = useGameStore((s) => s.screen);

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen key="home" />;
      case 'create': return <CreateScreen key="create" />;
      case 'join': return <JoinScreen key="join" initialCode={initialCode} />;
      case 'waiting': return <PlaceholderScreen key="waiting" name="WaitingRoom" />;
      case 'countdown': return <PlaceholderScreen key="countdown" name="CountdownScreen" />;
      case 'question': return <PlaceholderScreen key="question" name="QuestionScreen" />;
      case 'round_result': return <PlaceholderScreen key="round_result" name="RoundResult" />;
      case 'leaderboard': return <PlaceholderScreen key="leaderboard" name="InterimLeaderboard" />;
      case 'final': return <PlaceholderScreen key="final" name="FinalLeaderboard" />;
      default: return <HomeScreen key="home" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {renderScreen()}
    </AnimatePresence>
  );
};

export default GameShell;
