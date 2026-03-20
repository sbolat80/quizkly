import { useGameStore } from '@/stores/gameStore';

const Placeholder = ({ name }: { name: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-ocean-dark text-foreground text-2xl font-bold">
    {name}
  </div>
);

const GameShell = () => {
  const screen = useGameStore((s) => s.screen);

  switch (screen) {
    case 'home':
      return <Placeholder name="HomeScreen" />;
    case 'create':
      return <Placeholder name="CreateScreen" />;
    case 'join':
      return <Placeholder name="JoinScreen" />;
    case 'waiting':
      return <Placeholder name="WaitingRoom" />;
    case 'countdown':
      return <Placeholder name="CountdownScreen" />;
    case 'question':
      return <Placeholder name="QuestionScreen" />;
    case 'round_result':
      return <Placeholder name="RoundResult" />;
    case 'leaderboard':
      return <Placeholder name="InterimLeaderboard" />;
    case 'final':
      return <Placeholder name="FinalLeaderboard" />;
    default:
      return <Placeholder name="HomeScreen" />;
  }
};

export default GameShell;
