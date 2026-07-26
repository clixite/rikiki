import type { Card, Suit } from '@rikiki/shared';

const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK_LABEL: Record<number, string> = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' };

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOL[suit];
}

export function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

interface Props {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  raised?: boolean;
  onClick?: () => void;
}

const SIZES = {
  sm: 'w-9 h-13 text-[11px] rounded-md',
  md: 'w-12 h-17 text-sm rounded-lg',
  lg: 'w-16 h-23 text-base rounded-lg',
};

export default function CardFace({ card, size = 'md', disabled, raised, onClick }: Props) {
  const red = card.suit === 'H' || card.suit === 'D';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${SIZES[size]} relative flex flex-col items-center justify-center border border-gray-300 bg-white shadow-md transition-transform ${
        red ? 'text-red-600' : 'text-gray-900'
      } ${disabled ? 'opacity-40 saturate-50' : ''} ${raised ? '-translate-y-2' : ''} ${
        onClick && !disabled ? 'active:scale-95' : ''
      }`}
    >
      <span className="absolute left-1 top-0.5 font-bold leading-tight">{rankLabel(card.rank)}</span>
      <span className="text-xl leading-none">{SUIT_SYMBOL[card.suit]}</span>
      <span className="absolute bottom-0.5 right-1 rotate-180 font-bold leading-tight">{rankLabel(card.rank)}</span>
    </button>
  );
}

export function CardBack({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={`${SIZES[size]} border border-blue-900 bg-gradient-to-br from-blue-700 to-blue-900 shadow-md`}
    >
      <div className="m-1 h-[calc(100%-8px)] rounded-sm border border-blue-400/40" />
    </div>
  );
}
