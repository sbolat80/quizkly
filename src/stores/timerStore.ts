import { create } from 'zustand';

interface TimerStore {
  timeLeft: number;
  isRunning: boolean;
  _intervalId: ReturnType<typeof setInterval> | null;
  startTimer: (duration: number, onTick: (t: number) => void, onComplete: () => void) => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  timeLeft: 0,
  isRunning: false,
  _intervalId: null,

  startTimer: (duration, onTick, onComplete) => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);

    set({ timeLeft: duration, isRunning: true });

    const id = setInterval(() => {
      const current = get().timeLeft;
      if (current <= 1) {
        clearInterval(id);
        set({ timeLeft: 0, isRunning: false, _intervalId: null });
        onComplete();
      } else {
        const next = current - 1;
        set({ timeLeft: next });
        onTick(next);
      }
    }, 1000);

    set({ _intervalId: id });
  },

  stopTimer: () => {
    const { _intervalId } = get();
    if (_intervalId) clearInterval(_intervalId);
    set({ isRunning: false, _intervalId: null });
  },

  resetTimer: () => {
    const { _intervalId } = get();
    if (_intervalId) clearInterval(_intervalId);
    set({ timeLeft: 0, isRunning: false, _intervalId: null });
  },
}));
