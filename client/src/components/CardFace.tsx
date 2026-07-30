import { m as motion } from 'motion/react';
import type { Card, Suit } from '@rikiki/shared';
import { t } from '../i18n';

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

/**
 * Couleur d'encre d'une carte.
 * En mode « couleurs distinctes », les quatre enseignes ont chacune leur
 * teinte (paquet dit à quatre couleurs) : indispensable pour distinguer ♥ de
 * ♠ quand on ne perçoit pas le rouge.
 */
export function suitInkClass(suit: Suit): string {
  switch (suit) {
    case 'H':
      return 'text-suit-red';
    case 'D':
      return 'text-[var(--color-suit-diamond,var(--color-suit-red))]';
    case 'C':
      return 'text-[var(--color-suit-club,var(--color-suit-black))]';
    default:
      return 'text-suit-black';
  }
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
  /** Carte de la couleur d'atout : liseré laiton discret. */
  trump?: boolean;
  /**
   * Largeur imposée, en pixels. Le tapis calcule la sienne à partir de la place
   * réellement disponible : aucune taille figée ne peut convenir à la fois à
   * trois joueurs sur un grand écran et à huit sur un petit.
   */
  width?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Nom de la carte lu par les lecteurs d'écran, dans la langue de l'interface.
 * Sans cela, une carte n'est qu'un symbole muet pour qui navigue à la voix.
 */
export function cardLabel(card: Card): string {
  const m = t();
  const rank = m.rankNames[card.rank] ?? String(card.rank);
  return m.cardOf(rank, m.suitNames[card.suit] ?? card.suit);
}

export default function CardFace({
  card,
  size = 'md',
  dimmed,
  raised,
  onClick,
  layoutId,
  trump,
  width,
  className = '',
  ariaLabel,
}: Props) {
  const s = SIZES[size];
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

  const base = `${width === undefined ? s.w : ''} aspect-[2/3] ${s.radius} relative flex items-center justify-center
    bg-linear-to-b from-paper-50 to-paper-100
    ${trump ? 'ring-2 ring-brass-400' : 'ring-1 ring-black/15'}
    ${suitInkClass(card.suit)}
    ${dimmed ? 'opacity-35 saturate-50' : ''}
    ${className}`;

  const style = {
    boxShadow: raised ? 'var(--shadow-card-lifted)' : 'var(--shadow-card)',
    ...(width === undefined ? {} : { width }),
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
