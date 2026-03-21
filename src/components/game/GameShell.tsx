import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import HomeScreen from './HomeScreen';
import CreateScreen from './CreateScreen';
import JoinScreen from './JoinScreen';
import WaitingRoom from './WaitingRoom';
import CountdownScreen from './CountdownScreen';
import QuestionScreen from './QuestionScreen';
import RoundResult from './RoundResult';
import InterimLeaderboard from './InterimLeaderboard';

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
      case 'waiting': return <WaitingRoom key="waiting" />;
      case 'countdown': return <CountdownScreen key="countdown" />;
      case 'question': return <QuestionScreen key="question" />;
      case 'round_result': return <RoundResult key="round_result" />;
      case 'leaderboard': return <InterimLeaderboard key="leaderboard" />;
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
