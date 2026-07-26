import { useState } from 'react';
import { fr } from '../i18n/fr';

interface Props {
  cardsCount: number;
  legalBids: number[];
  onBid: (bid: number) => void;
}

export default function BidPicker({ cardsCount, legalBids, onBid }: Props) {
  const [pending, setPending] = useState<number | null>(null);
  const forbidden = Array.from({ length: cardsCount + 1 }, (_, i) => i).filter((b) => !legalBids.includes(b));

  return (
    <div className="animate-slide-up rounded-t-2xl bg-felt-800/95 px-4 pb-6 pt-4 shadow-2xl backdrop-blur">
      <p className="mb-3 text-center text-base font-semibold">{fr.yourBid}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: cardsCount + 1 }, (_, b) => b).map((b) => {
          const isLegal = legalBids.includes(b);
          return (
            <button
              key={b}
              type="button"
              data-testid={`bid-${b}`}
              disabled={!isLegal || pending !== null}
              onClick={() => {
                setPending(b);
                onBid(b);
              }}
              className={`h-12 w-12 rounded-full text-lg font-bold transition ${
                isLegal
                  ? 'bg-gold-400 text-felt-900 shadow-md active:scale-90'
                  : 'bg-white/10 text-white/30'
              } ${pending === b ? 'scale-90 opacity-60' : ''}`}
            >
              {b}
            </button>
          );
        })}
      </div>
      {forbidden.length > 0 && (
        <p className="mt-3 text-center text-xs text-white/60">{fr.hookForbidden(cardsCount)}</p>
      )}
    </div>
  );
}
