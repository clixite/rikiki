import type { Card } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import CardFace from './CardFace';

interface Props {
  hand: Card[];
  legalCardIds: string[] | null;
  onPlay: (cardId: string) => void;
}

export default function HandFan({ hand, legalCardIds, onPlay }: Props) {
  const myTurn = legalCardIds !== null;
  return (
    <div className="flex justify-center px-2">
      <div className="flex -space-x-3">
        {hand.map((card, i) => {
          const id = cardId(card);
          const legal = myTurn && legalCardIds.includes(id);
          const n = hand.length;
          const tilt = n > 1 ? (i - (n - 1) / 2) * Math.min(4, 30 / n) : 0;
          return (
            <div
              key={id}
              data-testid={`hand-${id}`}
              data-legal={legal ? 'true' : 'false'}
              style={{ transform: `rotate(${tilt}deg)`, transformOrigin: 'bottom center' }}
            >
              <CardFace
                card={card}
                size="lg"
                disabled={myTurn && !legal}
                raised={legal}
                onClick={myTurn ? () => onPlay(id) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
