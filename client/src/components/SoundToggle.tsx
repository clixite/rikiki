import { useSyncExternalStore } from 'react';
import { isMuted, setMuted, unlockAudio } from '../audio';
import { fr } from '../i18n/fr';

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function toggleMute(): void {
  setMuted(!isMuted());
  listeners.forEach((cb) => cb());
}

/**
 * Coupe-son. Présent sur TOUS les écrans de jeu, toujours au même endroit,
 * atteignable au pouce : couper le son doit prendre une seconde, sans menu.
 */
export default function SoundToggle({ className = '' }: { className?: string }) {
  const muted = useSyncExternalStore(subscribe, isMuted, isMuted);

  return (
    <button
      type="button"
      data-testid="sound-toggle"
      aria-pressed={muted}
      aria-label={muted ? fr.soundOn : fr.soundOff}
      title={muted ? fr.soundOn : fr.soundOff}
      onClick={() => {
        unlockAudio();
        toggleMute();
      }}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-felt-900/55 text-lg ring-1 ring-white/10 transition active:scale-90 ${className}`}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
