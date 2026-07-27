import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Card, Suit } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import CardFace from './CardFace';

interface Props {
  hand: Card[];
  /** null = ce n'est pas mon tour de jouer (cartes consultables, non cliquables). */
  legalCardIds: string[] | null;
  onPlay: (cardId: string) => void;
  /** Compacte l'éventail quand la barre d'annonce est affichée. */
  compact?: boolean;
  /** Couleur d'atout : les cartes concernées sont discrètement marquées. */
  trumpSuit?: Suit | null;
  /**
   * Change à chaque nouvelle donne : relance l'animation de distribution.
   * (Sert de clé d'animation, pas de simple indicateur.)
   */
  dealKey?: number;
}

const CARD_W_NORMAL = 68; // largeur d'une carte en jeu
const CARD_W_COMPACT = 54; // pendant l'annonce, la barre d'annonce prend de la place
const CARD_RATIO = 1.5; // hauteur = largeur × 1.5 (ratio 2:3 des cartes réelles)
const GAP_MAX = 10; // espace maximal entre deux cartes quand la main est petite
const RAISE_PX = 12; // remontée d'une carte jouable

/** Décalage entre deux cartes distribuées : court, pour rester nerveux. */
const DEAL_STAGGER_S = 0.055;

/**
 * Distance de glissement vers le haut au-delà de laquelle la carte est jouée.
 * Assez grande pour qu'un frôlement ne déclenche rien, assez courte pour
 * rester un geste du pouce.
 */
const DRAG_TO_PLAY_PX = 64;

/**
 * Main en éventail. L'espacement se resserre automatiquement pour que
 * TOUTES les cartes tiennent à l'écran, même à 10 cartes sur un petit
 * téléphone : jamais de défilement horizontal, jamais de carte hors champ.
 *
 * À chaque nouvelle donne, les cartes arrivent depuis le haut de la table en
 * cascade rapide — l'attente devient un petit moment de jeu.
 */
export default function HandFan({
  hand,
  legalCardIds,
  onPlay,
  compact,
  trumpSuit,
  dealKey = 0,
}: Props) {
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

  const cardW = compact ? CARD_W_COMPACT : CARD_W_NORMAL;
  const cardH = cardW * CARD_RATIO;

  // Pas horizontal : on part d'un espacement confortable puis on resserre
  // jusqu'à ce que la main entière tienne dans la largeur disponible.
  const available = Math.max(0, width - 8);
  const maxStep = cardW + GAP_MAX;
  const fitStep = n > 1 ? (available - cardW) / (n - 1) : 0;
  const step = n > 1 ? Math.max(cardW * 0.32, Math.min(maxStep, fitStep)) : 0;
  const fanWidth = n > 0 ? cardW + step * (n - 1) : 0;

  // Courbure de l'arc, et hauteur du conteneur calculée pour la contenir :
  // sans ça, les cartes des extrémités débordent et recouvrent ce qui est
  // au-dessus de la main.
  const liftFactor = n > 1 ? (compact ? 0.45 : 0.7) : 0;
  const maxLift = n > 1 ? ((n - 1) / 2) ** 2 * liftFactor : 0;
  const containerH = Math.ceil(cardH + maxLift + RAISE_PX);

  return (
    <div ref={ref} className="w-full px-1" data-testid="hand-fan">
      <div className="relative mx-auto" style={{ width: fanWidth, height: containerH }}>
        {hand.map((card, i) => {
          const id = cardId(card);
          const legal = myTurn && legalCardIds.includes(id);
          const isTrump = trumpSuit !== null && trumpSuit !== undefined && card.suit === trumpSuit;
          // Léger arc : rotation et hauteur variables autour du centre
          const centered = i - (n - 1) / 2;
          const tilt = n > 1 ? centered * Math.min(2.6, 22 / n) : 0;
          const lift = centered ** 2 * liftFactor;

          return (
            <motion.div
              // La clé inclut la donne : une nouvelle main rejoue l'animation
              key={`${dealKey}-${id}`}
              data-testid={`hand-${id}`}
              data-legal={legal ? 'true' : 'false'}
              className="absolute bottom-0"
              // Les cartes tombent depuis le haut de la table, en éventail
              initial={{ y: -220, opacity: 0, rotate: tilt - 18, scale: 0.9 }}
              animate={{ y: legal ? -RAISE_PX : 0, opacity: 1, rotate: tilt, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 480,
                damping: 32,
                delay: i * DEAL_STAGGER_S,
                opacity: { duration: 0.12, delay: i * DEAL_STAGGER_S },
              }}
              // Glisser la carte vers le haut pour la jouer : geste naturel des
              // jeux de cartes, et surtout impossible à déclencher par erreur —
              // contrairement au simple appui, irréversible au moindre faux
              // contact. L'appui reste actif pour qui préfère.
              drag={legal ? 'y' : false}
              dragConstraints={{ top: -140, bottom: 0 }}
              dragElastic={0.18}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (legal && info.offset.y < -DRAG_TO_PLAY_PX) onPlay(id);
              }}
              whileDrag={{ scale: 1.06, zIndex: 99 }}
              style={{
                left: i * step,
                transformOrigin: 'bottom center',
                marginBottom: maxLift - lift,
                zIndex: i,
                touchAction: legal ? 'none' : undefined,
              }}
            >
              <CardFace
                card={card}
                size={compact ? 'md' : 'lg'}
                layoutId={`card-${id}`}
                dimmed={myTurn && !legal}
                raised={legal}
                trump={isTrump}
                onClick={myTurn && legal ? () => onPlay(id) : undefined}
              />
              {legal && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brass-300"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
