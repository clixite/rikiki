import { useEffect, useState } from 'react';

/**
 * Décompte du tour.
 *
 * Sans repère visible, l'attente est désagréable des deux côtés : celui qui
 * joue ne sait pas qu'on va jouer à sa place, les autres ne savent pas combien
 * de temps ils patientent. Un anneau qui se vide dit les deux d'un coup d'œil,
 * sans chiffre à lire.
 *
 * Il ne s'affiche que dans les dernières secondes : un compte à rebours permanent
 * met une pression inutile sur une partie entre amis.
 */

/** Seuil d'apparition, en secondes. */
const VISIBLE_FROM = 15;

export function useSecondsLeft(deadline: number | null | undefined): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setLeft(null);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline]);

  return left;
}

export default function TurnCountdown({
  deadline,
  size = 56,
}: {
  deadline: number | null | undefined;
  size?: number;
}) {
  const left = useSecondsLeft(deadline);
  if (left === null || left > VISIBLE_FROM) return null;

  const ratio = Math.max(0, Math.min(1, left / VISIBLE_FROM));
  const radius = size / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const urgent = left <= 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute -inset-1 m-auto"
      aria-hidden="true"
      data-testid="turn-countdown"
      data-seconds={left}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={urgent ? 'var(--color-danger)' : 'var(--color-brass-400)'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s linear' }}
      />
    </svg>
  );
}
