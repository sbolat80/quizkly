import { useParams } from 'react-router-dom';

const JoinByLink = () => {
  const { code } = useParams();
  return (
    <div className="min-h-screen flex items-center justify-center bg-ocean-dark">
      <p className="text-2xl font-bold text-foreground">Joining... ({code})</p>
    </div>
  );
};

export default JoinByLink;
