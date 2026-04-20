let audioCtx: AudioContext | null = null;

// ============= Mute state (persisted in localStorage) =============
const MUTE_STORAGE_KEY = 'quizkly_sound_muted';
const muteListeners = new Set<(muted: boolean) => void>();

function readMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let isMuted = readMuted();

export function isSoundMuted(): boolean {
  return isMuted;
}

export function setSoundMuted(muted: boolean): void {
  isMuted = muted;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore quota / private mode errors */
  }
  muteListeners.forEach((cb) => cb(muted));
}

export function toggleSoundMuted(): boolean {
  setSoundMuted(!isMuted);
  return isMuted;
}

/** Subscribe to mute changes. Returns an unsubscribe function. */
export function subscribeSoundMuted(cb: (muted: boolean) => void): () => void {
  muteListeners.add(cb);
  return () => {
    muteListeners.delete(cb);
  };
}

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  /** Slide to this frequency over the duration */
  slideTo?: number;
  /** Vibrato depth in Hz */
  vibrato?: number;
  /** Vibrato speed in Hz */
  vibratoSpeed?: number;
  /** Attack time in seconds */
  attack?: number;
  /** Delay before playing, in seconds */
  delay?: number;
}

function playTone(opts: ToneOpts) {
  if (isMuted) return;
  const ctx = getCtx();
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const dur = opts.duration;
  const attack = opts.attack ?? 0.005;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);

  if (opts.slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);
  }

  // Vibrato via LFO
  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;
  if (opts.vibrato) {
    lfo = ctx.createOscillator();
    lfoGain = ctx.createGain();
    lfo.frequency.value = opts.vibratoSpeed ?? 6;
    lfoGain.gain.value = opts.vibrato;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur);
  }

  const peak = opts.gain ?? 0.15;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Short noise burst – good for "pop", "bonk", percussion. */
function playNoise(duration: number, gain = 0.1, filterFreq = 1000, delay = 0) {
  if (isMuted) return;
  const ctx = getCtx();
  const t0 = ctx.currentTime + delay;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration);
}

function playSequence(
  notes: { freq: number; duration?: number; type?: OscillatorType; gain?: number; slideTo?: number }[],
  noteSpacing: number,
  defaults: Partial<ToneOpts> = {},
) {
  notes.forEach((n, i) => {
    playTone({
      freq: n.freq,
      duration: n.duration ?? noteSpacing * 1.4,
      type: n.type ?? defaults.type ?? 'sine',
      gain: n.gain ?? defaults.gain ?? 0.12,
      slideTo: n.slideTo,
      delay: i * noteSpacing,
      attack: defaults.attack,
    });
  });
}

// ============= Public sound effects =============

/** Soft "tick" tap – playful click. */
export function playTap() {
  playTone({ freq: 1200, duration: 0.05, type: 'triangle', gain: 0.08, slideTo: 800 });
}

/** Bouncy "boing" select – two notes with slide. */
export function playSelect() {
  playTone({ freq: 500, duration: 0.1, type: 'triangle', gain: 0.12, slideTo: 800 });
  playTone({ freq: 800, duration: 0.12, type: 'sine', gain: 0.1, delay: 0.08, slideTo: 1100 });
}

/** Punchy countdown tick – noise blip + low tone. */
export function playCountdownTick() {
  playNoise(0.04, 0.06, 2000);
  playTone({ freq: 700, duration: 0.1, type: 'triangle', gain: 0.13, slideTo: 500 });
}

/** "GO!" – ascending fanfare blast. */
export function playCountdownGo() {
  playSequence(
    [
      { freq: 523, type: 'square', gain: 0.13 },
      { freq: 659, type: 'square', gain: 0.13 },
      { freq: 784, type: 'square', gain: 0.13 },
      { freq: 1047, type: 'triangle', gain: 0.16, duration: 0.3, slideTo: 1320 },
    ],
    0.07,
  );
  // Sparkle on top
  playTone({ freq: 2093, duration: 0.4, type: 'sine', gain: 0.05, delay: 0.28, vibrato: 30, vibratoSpeed: 12 });
}

/** Happy "ding-ding!" – arpeggio with sparkle. */
export function playCorrect() {
  playSequence(
    [
      { freq: 659, type: 'triangle', gain: 0.14 },
      { freq: 880, type: 'triangle', gain: 0.14 },
      { freq: 1319, type: 'sine', gain: 0.16, duration: 0.4, slideTo: 1568 },
    ],
    0.08,
  );
  playTone({ freq: 2637, duration: 0.5, type: 'sine', gain: 0.04, delay: 0.16, vibrato: 40, vibratoSpeed: 10 });
}

/** Comedic "wah-wah" descending bonk. */
export function playWrong() {
  playTone({ freq: 440, duration: 0.18, type: 'sawtooth', gain: 0.12, slideTo: 330 });
  playTone({ freq: 330, duration: 0.22, type: 'sawtooth', gain: 0.11, delay: 0.16, slideTo: 220 });
  playTone({ freq: 220, duration: 0.28, type: 'sawtooth', gain: 0.1, delay: 0.34, slideTo: 130 });
}

/** Buzzer – harsh time-up alert. */
export function playTimeUp() {
  for (let i = 0; i < 3; i++) {
    playTone({ freq: 180, duration: 0.18, type: 'square', gain: 0.13, delay: i * 0.15 });
    playNoise(0.18, 0.04, 600, i * 0.15);
  }
}

/** Triumphant game-over fanfare – heroic ascending run. */
export function playGameOver() {
  playSequence(
    [
      { freq: 523, type: 'triangle' },
      { freq: 659, type: 'triangle' },
      { freq: 784, type: 'triangle' },
      { freq: 1047, type: 'triangle', gain: 0.16 },
      { freq: 1319, type: 'sine', gain: 0.18, duration: 0.6, slideTo: 1568 },
    ],
    0.13,
    { gain: 0.14 },
  );
  // Twinkly sparkles
  [0.4, 0.55, 0.7, 0.85].forEach((d, i) => {
    playTone({ freq: 2093 + i * 200, duration: 0.25, type: 'sine', gain: 0.05, delay: d, vibrato: 25 });
  });
}

/** Friendly "pop" when a player joins. */
export function playPlayerJoin() {
  playTone({ freq: 600, duration: 0.1, type: 'sine', gain: 0.1, slideTo: 1100 });
  playNoise(0.04, 0.04, 3000, 0.02);
}

/** Sparkly leaderboard reveal. */
export function playLeaderboard() {
  playSequence(
    [
      { freq: 523, type: 'triangle' },
      { freq: 659, type: 'triangle' },
      { freq: 784, type: 'triangle' },
      { freq: 1047, type: 'sine', gain: 0.14, duration: 0.45 },
    ],
    0.12,
    { gain: 0.11 },
  );
  // Magical shimmer
  [0.05, 0.18, 0.32, 0.5].forEach((d, i) => {
    playTone({ freq: 1760 + i * 220, duration: 0.2, type: 'sine', gain: 0.04, delay: d });
  });
}

/** Goofy avatar boop – pitch varies per avatar. */
export function playAvatarSelect(avatarId: number) {
  const basePitch = 350 + avatarId * 70;
  playTone({ freq: basePitch, duration: 0.12, type: 'triangle', gain: 0.11, slideTo: basePitch * 1.6 });
  playTone({ freq: basePitch * 1.6, duration: 0.14, type: 'sine', gain: 0.09, delay: 0.1, slideTo: basePitch * 2 });
}
