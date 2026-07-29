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

const CARD_W_NORMAL = 72; // largeur visée d'une carte en jeu
const CARD_W_COMPACT = 56; // pendant l'annonce, la barre d'annonce prend de la place
const CARD_W_MIN = 40; // en dessous, le rang n'est plus lisible
const CARD_RATIO = 1.5; // hauteur = largeur × 1.5 (ratio 2:3 des cartes réelles)
const GAP_MAX = 10; // espace maximal entre deux cartes quand la main est petite
const RAISE_PX = 12; // remontée d'une carte jouable
/** Fraction de carte qui reste visible quand l'éventail est au plus serré. */
const MIN_VISIBLE = 0.34;
/** Marge de sécurité : anneau d'atout, ombre portée, arrondis de sous-pixels. */
const SAFETY_PX = 6;

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

  // Inclinaison de la carte la plus extérieure, en radians. Elle décide de la
  // place que l'éventail déborde de sa boîte : une carte penchée occupe plus
  // large que sa largeur nominale, et c'est précisément ce qui manquait au
  // calcul — à huit cartes sur un petit écran, la première sortait de l'écran.
  const tiltDeg = n > 1 ? Math.min(2.6, 22 / n) : 0;
  const maxTilt = (((n - 1) / 2) * tiltDeg * Math.PI) / 180;

  // Largeur réellement disponible : le conteneur porte px-1 de chaque côté.
  const available = Math.max(0, width - 8 - SAFETY_PX);

  /**
   * Plus grande largeur de carte telle que l'éventail — débordement dû à
   * l'inclinaison compris — tienne entièrement dans l'espace disponible, même
   * resserré au maximum.
   */
  const compressed = 1 + MIN_VISIBLE * (n - 1);
  const overhangFactor = 2 * CARD_RATIO * Math.sin(maxTilt);
  const widthCap = n > 0 ? available / (compressed + overhangFactor) : available;

  const cardW = Math.max(
    CARD_W_MIN,
    Math.min(compact ? CARD_W_COMPACT : CARD_W_NORMAL, widthCap),
  );
  const cardH = cardW * CARD_RATIO;
  const overhang = cardH * Math.sin(maxTilt);

  // Pas horizontal : on part d'un espacement confortable puis on resserre
  // jusqu'à ce que la main entière tienne dans la largeur disponible.
  const usable = Math.max(0, available - 2 * overhang);
  const maxStep = cardW + GAP_MAX;
  const fitStep = n > 1 ? (usable - cardW) / (n - 1) : 0;
  const step = n > 1 ? Math.max(cardW * MIN_VISIBLE, Math.min(maxStep, fitStep)) : 0;
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
          const tilt = centered * tiltDeg;
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
                width={cardW}
                size={cardW >= 62 ? 'lg' : cardW >= 50 ? 'md' : 'sm'}
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
