import { useLayoutEffect, useRef, useState } from 'react';
import type { Card } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import CardFace from './CardFace';

interface Props {
  hand: Card[];
  /** null = ce n'est pas mon tour de jouer (cartes consultables, non cliquables). */
  legalCardIds: string[] | null;
  onPlay: (cardId: string) => void;
  /** Compacte l'éventail quand la barre d'annonce est affichée. */
  compact?: boolean;
}

const CARD_W = 68; // largeur d'une carte « lg » en pixels
const GAP_MAX = 10; // espace maximal entre deux cartes quand la main est petite

/**
 * Main en éventail. L'espacement se resserre automatiquement pour que
 * TOUTES les cartes tiennent à l'écran, même à 10 cartes sur un petit
 * téléphone : jamais de défilement horizontal, jamais de carte hors champ.
 */
export default function HandFan({ hand, legalCardIds, onPlay, compact }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const myTurn = legalCardIds !== null;
  const n = hand.length;

  // Pas horizontal : on part d'un espacement confortable puis on resserre
  // jusqu'à ce que la main entière tienne dans la largeur disponible.
  const available = Math.max(0, width - 8);
  const maxStep = CARD_W + GAP_MAX;
  const fitStep = n > 1 ? (available - CARD_W) / (n - 1) : 0;
  const step = n > 1 ? Math.max(22, Math.min(maxStep, fitStep)) : 0;
  const fanWidth = n > 0 ? CARD_W + step * (n - 1) : 0;

  return (
    <div ref={ref} className="w-full px-1" data-testid="hand-fan">
      <div
        className="relative mx-auto"
        style={{ width: fanWidth, height: compact ? 84 : 102 }}
      >
        {hand.map((card, i) => {
          const id = cardId(card);
          const legal = myTurn && legalCardIds.includes(id);
          // Léger arc : rotation et hauteur variables autour du centre
          const centered = i - (n - 1) / 2;
          const tilt = n > 1 ? centered * Math.min(2.6, 22 / n) : 0;
          const lift = n > 1 ? Math.abs(centered) ** 2 * (compact ? 0.5 : 0.8) : 0;

          return (
            <div
              key={id}
              data-testid={`hand-${id}`}
              data-legal={legal ? 'true' : 'false'}
              className="absolute bottom-0 transition-transform duration-200"
              style={{
                left: i * step,
                transform: `translateY(${lift + (legal ? -12 : 0)}px) rotate(${tilt}deg)`,
                transformOrigin: 'bottom center',
                zIndex: i,
              }}
            >
              <CardFace
                card={card}
                size="lg"
                layoutId={`card-${id}`}
                dimmed={myTurn && !legal}
                raised={legal}
                onClick={myTurn && legal ? () => onPlay(id) : undefined}
              />
              {legal && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brass-300"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
