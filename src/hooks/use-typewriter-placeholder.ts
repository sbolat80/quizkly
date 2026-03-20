import { useState, useEffect, useRef } from 'react';

export function useTypewriterPlaceholder(
  text: string,
  speed = 60,
  pauseMs = 600
) {
  const [display, setDisplay] = useState('');
  const dirRef = useRef<'typing' | 'deleting'>('typing');
  const idxRef = useRef(0);

  useEffect(() => {
    dirRef.current = 'typing';
    idxRef.current = 0;
    setDisplay('');

    const tick = () => {
      if (dirRef.current === 'typing') {
        idxRef.current++;
        setDisplay(text.slice(0, idxRef.current));
        if (idxRef.current >= text.length) {
          dirRef.current = 'deleting';
          timer = window.setTimeout(tick, pauseMs);
          return;
        }
      } else {
        idxRef.current--;
        setDisplay(text.slice(0, idxRef.current));
        if (idxRef.current <= 0) {
          dirRef.current = 'typing';
          timer = window.setTimeout(tick, pauseMs);
          return;
        }
      }
      timer = window.setTimeout(tick, speed);
    };

    let timer = window.setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [text, speed, pauseMs]);

  return display;
}
