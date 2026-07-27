import { motion } from 'motion/react';
import type { Card, Suit } from '@rikiki/shared';

const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK_LABEL: Record<number, string> = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' };

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOL[suit];
}

export function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

export type CardSize = 'xs' | 'sm' | 'md' | 'lg';

/** Dimensions au ratio 2:3 des cartes à jouer réelles. */
const SIZES: Record<CardSize, { w: string; rank: string; pip: string; radius: string }> = {
  xs: { w: 'w-7', rank: 'text-[9px]', pip: 'text-sm', radius: 'rounded-[3px]' },
  sm: { w: 'w-9', rank: 'text-[11px]', pip: 'text-lg', radius: 'rounded-[4px]' },
  md: { w: 'w-12', rank: 'text-[13px]', pip: 'text-2xl', radius: 'rounded-md' },
  lg: { w: 'w-[4.25rem]', rank: 'text-[15px]', pip: 'text-3xl', radius: 'rounded-lg' },
};

interface Props {
  card: Card;
  size?: CardSize;
  /** Grisée : coup interdit. */
  dimmed?: boolean;
  /** Surélevée : coup jouable. */
  raised?: boolean;
  onClick?: () => void;
  /** Partage l'identité entre la main et le tapis pour animer le trajet. */
  layoutId?: string;
  className?: string;
  ariaLabel?: string;
}

const SUIT_NAMES: Record<Suit, string> = { S: 'pique', H: 'cœur', D: 'carreau', C: 'trèfle' };
const RANK_NAMES: Record<number, string> = { 11: 'valet', 12: 'dame', 13: 'roi', 14: 'as' };

export function cardLabel(card: Card): string {
  return `${RANK_NAMES[card.rank] ?? card.rank} de ${SUIT_NAMES[card.suit]}`;
}

export default function CardFace({
  card,
  size = 'md',
  dimmed,
  raised,
  onClick,
  layoutId,
  className = '',
  ariaLabel,
}: Props) {
  const s = SIZES[size];
  const red = isRedSuit(card.suit);
  const interactive = Boolean(onClick);

  const content = (
    <>
      {/* Coin haut-gauche : rang + couleur, comme sur une vraie carte */}
      <span className={`absolute left-1 top-0.5 font-bold leading-none tracking-tight ${s.rank}`}>
        {rankLabel(card.rank)}
        <span className="block text-center leading-none">{SUIT_SYMBOL[card.suit]}</span>
      </span>
      {/* Symbole central */}
      <span className={`${s.pip} leading-none`}>{SUIT_SYMBOL[card.suit]}</span>
      {/* Coin bas-droit, inversé */}
      <span className={`absolute bottom-0.5 right-1 rotate-180 font-bold leading-none tracking-tight ${s.rank}`}>
        {rankLabel(card.rank)}
        <span className="block text-center leading-none">{SUIT_SYMBOL[card.suit]}</span>
      </span>
    </>
  );

  const base = `${s.w} aspect-[2/3] ${s.radius} relative flex items-center justify-center
    bg-linear-to-b from-paper-50 to-paper-100 ring-1 ring-black/15
    ${red ? 'text-suit-red' : 'text-suit-black'}
    ${dimmed ? 'opacity-35 saturate-50' : ''}
    ${className}`;

  const style = {
    boxShadow: raised ? 'var(--shadow-card-lifted)' : 'var(--shadow-card)',
  };

  if (!interactive) {
    return (
      <motion.div
        layoutId={layoutId}
        className={base}
        style={style}
        role="img"
        aria-label={ariaLabel ?? cardLabel(card)}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.button
      layoutId={layoutId}
      type="button"
      onClick={onClick}
      disabled={dimmed}
      whileTap={dimmed ? undefined : { scale: 0.94 }}
      className={`${base} ${dimmed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={style}
      aria-label={ariaLabel ?? cardLabel(card)}
    >
      {content}
    </motion.button>
  );
}

/** Dos de carte : motif géométrique discret, sans image externe. */
export function CardBack({ size = 'sm', className = '' }: { size?: CardSize; className?: string }) {
  const s = SIZES[size];
  return (
    <div
      className={`${s.w} aspect-[2/3] ${s.radius} ring-1 ring-black/25 bg-felt-700 relative overflow-hidden ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0 3px, rgb(255 255 255 / 0.16) 3px 4px), repeating-linear-gradient(-45deg, transparent 0 3px, rgb(255 255 255 / 0.16) 3px 4px)',
        }}
      />
      <div className="absolute inset-[3px] rounded-[2px] ring-1 ring-brass-400/30" />
    </div>
  );
}
