let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNotes(freqs: number[], interval: number, type: OscillatorType = 'sine', gain = 0.12) {
  freqs.forEach((f, i) => {
    setTimeout(() => playTone(f, interval * 1.2, type, gain), i * interval * 1000);
  });
}

export function playTap() {
  playTone(800, 0.06, 'square', 0.08);
}

export function playSelect() {
  playNotes([440, 660], 0.08, 'sine', 0.1);
}

export function playCountdownTick() {
  playTone(600, 0.08, 'sine', 0.1);
}

export function playCountdownGo() {
  playNotes([523, 659, 784, 1047], 0.1, 'triangle', 0.15);
}

export function playCorrect() {
  playNotes([523, 659, 784], 0.12, 'sine', 0.15);
}

export function playWrong() {
  playNotes([400, 300], 0.15, 'sawtooth', 0.1);
}

export function playTimeUp() {
  playNotes([200, 200, 200], 0.12, 'square', 0.12);
}

export function playGameOver() {
  playNotes([523, 659, 784, 1047, 1319], 0.15, 'triangle', 0.15);
}

export function playPlayerJoin() {
  playTone(880, 0.12, 'sine', 0.08);
}

export function playLeaderboard() {
  playNotes([392, 523, 659, 784], 0.18, 'triangle', 0.12);
}

export function playAvatarSelect(avatarId: number) {
  const basePitch = 400 + avatarId * 60;
  playNotes([basePitch, basePitch * 1.25], 0.08, 'sine', 0.1);
}
