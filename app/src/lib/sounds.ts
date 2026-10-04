type AudioContextConstructor = new () => AudioContext;

let context: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  if (context) return context;

  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const Constructor = scope.AudioContext ?? scope.webkitAudioContext;

  if (!Constructor) return null;

  context = new Constructor();

  return context;
};

export function unlockSounds(): void {
  const audioContext = getAudioContext();

  if (audioContext && audioContext.state === 'suspended') {
    void audioContext.resume();
  }
}

type Tone = {
  duration: number;
  frequency: number;
  offset: number;
  type?: OscillatorType;
  volume?: number;
};

const playTones = (tones: Tone[]): void => {
  const audioContext = getAudioContext();

  if (!audioContext) return;

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  const start = audioContext.currentTime;

  tones.forEach(({ duration, frequency, offset, type = 'sine', volume = 0.14 }) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const toneStart = start + offset;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, toneStart);

    gain.gain.setValueAtTime(0.0001, toneStart);
    gain.gain.exponentialRampToValueAtTime(volume, toneStart + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneStart + duration + 0.03);
  });
};

export function playSuccess(): void {
  playTones([
    { duration: 0.1, frequency: 659.25, offset: 0 },
    { duration: 0.16, frequency: 987.77, offset: 0.1 },
  ]);
}

export function playError(): void {
  playTones([
    { duration: 0.16, frequency: 196, offset: 0, type: 'sawtooth', volume: 0.1 },
    { duration: 0.2, frequency: 146.83, offset: 0.15, type: 'sawtooth', volume: 0.1 },
  ]);
}
