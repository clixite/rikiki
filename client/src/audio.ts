/**
 * Sons du jeu, entièrement synthétisés via l'API Web Audio.
 * Aucun fichier à télécharger : rien à précharger, fonctionne hors ligne,
 * et le rendu reste net à tous les volumes.
 */

export type SoundName =
  | 'cardPlay'
  | 'cardDeal'
  | 'dealStart'
  | 'bid'
  | 'trickWin'
  | 'trickLose'
  | 'yourTurn'
  | 'roundEnd'
  | 'contractSuccess'
  | 'contractFail'
  | 'victory'
  | 'defeat'
  | 'gameStart'
  | 'join';

const MUTE_KEY = 'rikiki-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  }
  // Les navigateurs suspendent le contexte tant qu'il n'y a pas eu d'interaction
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  /** Glissando vers cette fréquence. */
  slideTo?: number;
}

function tone({ freq, duration, type = 'sine', gain = 0.5, delay = 0, slideTo }: ToneOptions): void {
  const audio = ensureContext();
  if (!audio || !master) return;
  const t0 = audio.currentTime + delay;

  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
  }

  // Enveloppe percussive : attaque courte, décroissance exponentielle
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Bruit filtré : évoque le frottement du carton, sans échantillon. */
function noiseBurst(duration = 0.09, gain = 0.35, filterFreq = 1800): void {
  const audio = ensureContext();
  if (!audio || !master) return;
  const t0 = audio.currentTime;
  const frames = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Décroissance rapide pour un « fshht » sec
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2.5;
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;

  const env = audio.createGain();
  env.gain.value = gain;

  src.connect(filter);
  filter.connect(env);
  env.connect(master);
  src.start(t0);
}

const SOUNDS: Record<SoundName, () => void> = {
  // Carte posée sur le tapis : souffle mat + petit thud
  cardPlay: () => {
    noiseBurst(0.075, 0.3, 2200);
    tone({ freq: 190, duration: 0.07, type: 'triangle', gain: 0.22, slideTo: 120 });
  },
  // Distribution : plusieurs cartes qui glissent
  cardDeal: () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => noiseBurst(0.06, 0.18, 2600), i * 85);
    }
  },

  // Donne : rafale rapide de cartes distribuées, calée sur l'animation.
  // Le rythme s'accélère légèrement — c'est ce qui donne l'impression d'élan.
  dealStart: () => {
    for (let i = 0; i < 7; i++) {
      const delay = i * 0.055 - i * i * 0.002;
      setTimeout(
        () => {
          noiseBurst(0.05, 0.26 - i * 0.015, 2400 + i * 120);
          tone({ freq: 150 + i * 14, duration: 0.045, type: 'triangle', gain: 0.12 });
        },
        Math.max(0, delay * 1000),
      );
    }
  },

  // Lancement de la partie : petite montée qui appelle au jeu
  gameStart: () => {
    [392, 523.25, 659.25].forEach((f, i) =>
      tone({ freq: f, duration: 0.16, type: 'triangle', gain: 0.24, delay: i * 0.07 }),
    );
  },

  // Contrat tenu : accord clair et net
  contractSuccess: () => {
    tone({ freq: 523.25, duration: 0.16, type: 'sine', gain: 0.3 });
    tone({ freq: 659.25, duration: 0.2, type: 'sine', gain: 0.26, delay: 0.06 });
    tone({ freq: 987.77, duration: 0.26, type: 'sine', gain: 0.18, delay: 0.13 });
  },

  // Contrat manqué : descente courte, jamais humiliante
  contractFail: () => {
    tone({ freq: 415.3, duration: 0.14, type: 'triangle', gain: 0.2 });
    tone({ freq: 311.13, duration: 0.24, type: 'triangle', gain: 0.18, delay: 0.1 });
  },

  // Partie perdue : cadence descendante douce
  defeat: () => {
    [440, 392, 329.63, 261.63].forEach((f, i) =>
      tone({ freq: f, duration: 0.3, type: 'sine', gain: 0.18, delay: i * 0.13 }),
    );
  },
  // Annonce validée : petit blip net
  bid: () => {
    tone({ freq: 620, duration: 0.09, type: 'triangle', gain: 0.3 });
    tone({ freq: 930, duration: 0.07, type: 'sine', gain: 0.16, delay: 0.05 });
  },
  // Pli gagné : tierce ascendante chaleureuse
  trickWin: () => {
    tone({ freq: 523.25, duration: 0.13, type: 'sine', gain: 0.34 });
    tone({ freq: 659.25, duration: 0.13, type: 'sine', gain: 0.3, delay: 0.075 });
    tone({ freq: 783.99, duration: 0.22, type: 'sine', gain: 0.26, delay: 0.15 });
  },
  // Pli perdu : note descendante discrète (jamais punitive)
  trickLose: () => {
    tone({ freq: 300, duration: 0.16, type: 'sine', gain: 0.14, slideTo: 220 });
  },
  // À toi de jouer : deux notes douces, reconnaissables sans être stressantes
  yourTurn: () => {
    tone({ freq: 880, duration: 0.11, type: 'sine', gain: 0.24 });
    tone({ freq: 1174.66, duration: 0.16, type: 'sine', gain: 0.2, delay: 0.09 });
  },
  // Fin de manche : accord parfait
  roundEnd: () => {
    tone({ freq: 392, duration: 0.3, type: 'sine', gain: 0.22 });
    tone({ freq: 523.25, duration: 0.3, type: 'sine', gain: 0.2, delay: 0.04 });
    tone({ freq: 659.25, duration: 0.34, type: 'sine', gain: 0.18, delay: 0.08 });
  },
  // Victoire : petite fanfare
  victory: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone({ freq: f, duration: 0.28, type: 'triangle', gain: 0.26, delay: i * 0.11 }));
    tone({ freq: 1318.51, duration: 0.5, type: 'sine', gain: 0.2, delay: 0.46 });
  },
  // Quelqu'un rejoint le salon
  join: () => {
    tone({ freq: 587.33, duration: 0.1, type: 'sine', gain: 0.22 });
    tone({ freq: 880, duration: 0.14, type: 'sine', gain: 0.18, delay: 0.07 });
  },
};

export function playSound(name: SoundName): void {
  if (muted) return;
  try {
    SOUNDS[name]();
  } catch {
    // Le son ne doit jamais casser le jeu
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    // stockage indisponible (navigation privée) : on garde l'état en mémoire
  }
  if (!next) {
    // Retour sonore immédiat à la réactivation
    playSound('bid');
  }
}

/**
 * À appeler sur la première interaction utilisateur : débloque le contexte
 * audio, que les navigateurs mobiles maintiennent suspendu sinon.
 */
export function unlockAudio(): void {
  ensureContext();
}
