// Sonido sintetizado con WebAudio: cero archivos, latencia mínima, toggle persistente.
// Carácter GEN+: tonos cortos, limpios, sin chiptune infantil.

const SOUND_KEY = 'trainermath-v3:sound';

let context: AudioContext | null = null;
let enabled = readStoredSound();

function readStoredSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export const isSoundEnabled = () => enabled;

export const setSoundEnabled = (value: boolean) => {
  enabled = value;
  try {
    localStorage.setItem(SOUND_KEY, value ? 'on' : 'off');
  } catch {
    // localStorage puede fallar en contextos restringidos.
  }
};

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
};

interface ToneSpec {
  freq: number;
  /** desplazamiento del inicio en segundos */
  at?: number;
  durationMs?: number;
  type?: OscillatorType;
  gain?: number;
  /** glide hacia esta frecuencia al final */
  glideTo?: number;
}

const play = (tones: ToneSpec[]) => {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const tone of tones) {
    const start = now + (tone.at ?? 0);
    const duration = (tone.durationMs ?? 90) / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.glideTo) osc.frequency.exponentialRampToValueAtTime(tone.glideTo, start + duration);
    const peak = tone.gain ?? 0.06;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0004, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
};

/** Acierto: tick corto y limpio. Sube medio tono con el combo (cap en +12). */
export const playCorrect = (combo = 0) => {
  const step = Math.min(combo, 12);
  const freq = 660 * Math.pow(2, step / 24);
  play([{ freq, durationMs: 80, type: 'sine', gain: 0.055 }]);
};

/** Fallo: descenso corto, sobrio — informa sin castigar. */
export const playIncorrect = () => {
  play([{ freq: 220, glideTo: 150, durationMs: 160, type: 'triangle', gain: 0.05 }]);
};

/** Aparición de número en Flash Anzan: pulso neutro muy corto. */
export const playFlashTick = () => {
  play([{ freq: 520, durationMs: 45, type: 'sine', gain: 0.03 }]);
};

/** Countdown 3-2-1: tres pulsos y uno final más agudo. */
export const playCountdownTick = (isFinal = false) => {
  play([{ freq: isFinal ? 880 : 440, durationMs: isFinal ? 140 : 70, type: 'sine', gain: 0.05 }]);
};

/** Cierre de sesión: acorde ascendente breve (logro). */
export const playSessionComplete = () => {
  play([
    { freq: 523.25, at: 0, durationMs: 140, gain: 0.05 },
    { freq: 659.25, at: 0.09, durationMs: 140, gain: 0.05 },
    { freq: 783.99, at: 0.18, durationMs: 220, gain: 0.055 },
  ]);
};

/** Récord personal / subida de rango: arpegio con quinta extra. */
export const playRankUp = () => {
  play([
    { freq: 523.25, at: 0, durationMs: 120, gain: 0.05 },
    { freq: 659.25, at: 0.08, durationMs: 120, gain: 0.05 },
    { freq: 783.99, at: 0.16, durationMs: 120, gain: 0.05 },
    { freq: 1046.5, at: 0.24, durationMs: 260, gain: 0.06 },
  ]);
};

/** Combo caliente (umbral alcanzado): doble tick brillante. */
export const playComboMilestone = () => {
  play([
    { freq: 880, at: 0, durationMs: 60, gain: 0.05 },
    { freq: 1174.66, at: 0.07, durationMs: 90, gain: 0.055 },
  ]);
};
