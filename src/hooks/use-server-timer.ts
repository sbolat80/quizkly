import { useState, useEffect, useRef } from 'react';

export function useServerTimer(phaseStartedAt: string | null, duration: number): number {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!phaseStartedAt) {
      setTimeLeft(duration);
      return;
    }

    const calculate = () => {
      const elapsed = (Date.now() - new Date(phaseStartedAt).getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(duration - elapsed));
      setTimeLeft(remaining);
      return remaining;
    };

    calculate();

    intervalRef.current = setInterval(() => {
      const remaining = calculate();
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phaseStartedAt, duration]);

  return timeLeft;
}
