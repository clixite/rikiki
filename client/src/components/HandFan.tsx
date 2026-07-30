import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WheelEvent } from 'react';
import { motion, useMotionValue } from 'motion/react';
import type { Card, Suit } from '@rikiki/shared';
import { cardId } from '@rikiki/shared';
import CardFace from './CardFace';
import { vibrate } from '../haptics';
import { useT } from '../i18n';

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

/** Largeur du bouton « étaler la main », posé à droite de l'éventail. */
const TOGGLE_W = 30;
/** Espace entre deux cartes une fois la main étalée : elles ne se touchent plus. */
const GAP_SPREAD = 8;
/**
 * Délai avant que la dernière carte jouable parte toute seule.
 * Assez long pour que l'œil suive ce qui se passe, assez court pour ne pas
 * donner l'impression que le jeu a planté.
 */
const AUTO_LAST_CARD_MS = 450;

/**
 * Main en éventail. L'espacement se resserre automatiquement pour que
 * TOUTES les cartes tiennent à l'écran, même à 10 cartes sur un petit
 * téléphone : jamais de défilement horizontal de la page, jamais de carte
 * hors champ.
 *
 * Trois demandes de joueur, en plus de l'affichage :
 *  1. pré-choisir une carte hors de son tour : elle part dès que le tour vient ;
 *  2. étaler la main et la parcourir au doigt quand l'éventail est trop serré ;
 *  3. la dernière carte jouable se pose toute seule — il n'y a rien à décider.
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
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  /** Carte désignée d'avance, en attendant que le tour arrive. */
  const [preselected, setPreselected] = useState<string | null>(null);
  /** Souhait du joueur : main étalée plutôt qu'éventail resserré. */
  const [spreadWanted, setSpreadWanted] = useState(false);
  /** Décalage horizontal du rail de cartes quand la main est étalée. */
  const x = useMotionValue(0);

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

  // ───────────────────────────────────────────────────────────────────────
  // Envoi d'un coup : un seul, jamais deux
  // ───────────────────────────────────────────────────────────────────────

  // `onPlay` et `legalCardIds` sont recréés à chaque rendu du parent. Si les
  // effets ci-dessous en dépendaient, le minuteur de la dernière carte serait
  // relancé à chaque rendu et ne se déclencherait jamais. On garde donc une
  // référence vivante vers les valeurs fraîches et une fonction `play` stable.
  const latest = useRef({ onPlay, dealKey });
  latest.current = { onPlay, dealKey };

  /** Un coup a déjà été envoyé pour le tour en cours. */
  const sentThisTurn = useRef(false);
  /** `donne:carte` du dernier coup AUTOMATIQUE, pour ne jamais le rejouer. */
  const autoPlayed = useRef<string | null>(null);

  useEffect(() => {
    // Le tour est passé (ou le coup optimiste a été pris en compte : le parent
    // met alors `legalCardIds` à null) : le verrou retombe. Sans ce retour à
    // zéro, un coup refusé par le serveur laisserait la main figée.
    if (!myTurn) sentThisTurn.current = false;
  }, [myTurn]);

  const play = useCallback((id: string, auto = false) => {
    if (sentThisTurn.current) return; // un seul coup par tour, quoi qu'il arrive
    if (auto) {
      // Un coup automatique refusé ne doit pas repartir en boucle : une fois
      // tenté dans cette donne, cette carte ne se rejouera plus toute seule.
      const token = `${latest.current.dealKey}:${id}`;
      if (autoPlayed.current === token) return;
      autoPlayed.current = token;
    }
    sentThisTurn.current = true;
    setPreselected(null);
    latest.current.onPlay(id);
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // 1. Pré-sélection : désigner sa carte avant son tour
  // ───────────────────────────────────────────────────────────────────────

  // Nouvelle donne : le choix d'avance de la donne précédente n'a plus de sens.
  useEffect(() => {
    setPreselected(null);
  }, [dealKey]);

  // La carte pré-choisie a quitté la main (jouée, ou main remplacée) : on oublie.
  const preselectedGone = preselected !== null && !hand.some((c) => cardId(c) === preselected);
  useEffect(() => {
    if (preselectedGone) setPreselected(null);
  }, [preselectedGone]);

  // Chaîne stable des coups légaux : la comparer évite de relancer les effets à
  // chaque rendu, alors que le tableau, lui, est recréé sans cesse.
  const legalKey = legalCardIds === null ? null : legalCardIds.join(',');

  useEffect(() => {
    if (legalKey === null || preselected === null) return;
    if (!legalKey.split(',').includes(preselected)) {
      // Devenue interdite entre-temps (couleur demandée) : abandon silencieux,
      // le joueur reprend la main sans qu'on ait joué à sa place.
      setPreselected(null);
      return;
    }
    play(preselected, true);
  }, [legalKey, preselected, play]);

  // ───────────────────────────────────────────────────────────────────────
  // 3. Dernière carte jouable : rien à décider, on la pose
  // ───────────────────────────────────────────────────────────────────────

  // Plus grande main vue dans cette donne. Dans une manche à une seule carte,
  // la main n'a jamais compté de choix : la jouer d'office ferait passer la
  // manche entière sans que le joueur ait rien vu. On laisse alors poser.
  const dealPeak = useRef({ dealKey, size: n });
  if (dealPeak.current.dealKey !== dealKey) dealPeak.current = { dealKey, size: n };
  else if (n > dealPeak.current.size) dealPeak.current.size = n;

  const soloLegalId = myTurn && legalCardIds.length === 1 ? legalCardIds[0] : null;
  const autoLastCard = soloLegalId !== null && dealPeak.current.size > 1;

  useEffect(() => {
    if (!autoLastCard || soloLegalId === null) return;
    const timer = window.setTimeout(() => play(soloLegalId, true), AUTO_LAST_CARD_MS);
    // Démontage, changement de tour, carte devenue non unique : on annule.
    return () => window.clearTimeout(timer);
  }, [autoLastCard, soloLegalId, play]);

  // ───────────────────────────────────────────────────────────────────────
  // Géométrie : éventail resserré (défaut) ou main étalée (défilement)
  // ───────────────────────────────────────────────────────────────────────

  const targetW = compact ? CARD_W_COMPACT : CARD_W_NORMAL;

  // Le bouton d'étalement n'a de sens que si la main est réellement à l'étroit :
  // sur grand écran, elle tient déjà à taille confortable, cartes séparées.
  const roomy = n * targetW + Math.max(0, n - 1) * GAP_SPREAD <= width - 8 - SAFETY_PX;
  const canSpread = n > 2 && width > 0 && !roomy;
  const isSpread = canSpread && spreadWanted;

  // Largeur réellement disponible : le conteneur porte px-1 de chaque côté, et
  // le bouton d'étalement, lui, ne recouvre jamais les cartes.
  const available = Math.max(0, width - 8 - SAFETY_PX - (canSpread ? TOGGLE_W + 4 : 0));

  // Inclinaison de la carte la plus extérieure, en radians. Elle décide de la
  // place que l'éventail déborde de sa boîte : une carte penchée occupe plus
  // large que sa largeur nominale, et c'est précisément ce qui manquait au
  // calcul — à huit cartes sur un petit écran, la première sortait de l'écran.
  // Main étalée : les cartes sont droites, on ne cherche plus à gagner de place.
  const tiltDeg = !isSpread && n > 1 ? Math.min(2.6, 22 / n) : 0;
  const maxTilt = (((n - 1) / 2) * tiltDeg * Math.PI) / 180;

  /**
   * Plus grande largeur de carte telle que l'éventail — débordement dû à
   * l'inclinaison compris — tienne entièrement dans l'espace disponible, même
   * resserré au maximum.
   */
  const compressed = 1 + MIN_VISIBLE * (n - 1);
  const overhangFactor = 2 * CARD_RATIO * Math.sin(maxTilt);
  const widthCap = n > 0 ? available / (compressed + overhangFactor) : available;

  const cardW = isSpread
    ? // Étalée, la main a le droit de dépasser l'écran : on rend aux cartes
      // leur taille de lecture confortable, quitte à en faire défiler.
      Math.max(CARD_W_MIN, Math.min(targetW, Math.round(available * 0.45)))
    : Math.max(CARD_W_MIN, Math.min(targetW, widthCap));
  const cardH = cardW * CARD_RATIO;
  const overhang = cardH * Math.sin(maxTilt);

  // Pas horizontal : on part d'un espacement confortable puis on resserre
  // jusqu'à ce que la main entière tienne dans la largeur disponible.
  const usable = Math.max(0, available - 2 * overhang);
  const maxStep = cardW + GAP_MAX;
  const fitStep = n > 1 ? (usable - cardW) / (n - 1) : 0;
  const step = isSpread
    ? cardW + GAP_SPREAD
    : n > 1
      ? Math.max(cardW * MIN_VISIBLE, Math.min(maxStep, fitStep))
      : 0;

  // Courbure de l'arc, et hauteur du conteneur calculée pour la contenir :
  // sans ça, les cartes des extrémités débordent et recouvrent ce qui est
  // au-dessus de la main.
  const liftFactor = !isSpread && n > 1 ? (compact ? 0.45 : 0.7) : 0;
  const maxLift = n > 1 ? ((n - 1) / 2) ** 2 * liftFactor : 0;
  const containerH = Math.ceil(cardH + maxLift + RAISE_PX);

  // Rail des cartes et fenêtre qui le laisse voir. Tant que le rail tient dans
  // la fenêtre, rien ne défile et la mise en page est celle d'avant.
  const trackW = n > 0 ? cardW + step * (n - 1) : 0;
  const windowW = Math.min(available, trackW);
  const canScroll = isSpread && trackW > windowW + 1;
  const minX = Math.min(0, windowW - trackW);

  useEffect(() => {
    // Le rail rétrécit (carte jouée, retour à l'éventail, rotation de l'écran) :
    // on recale la fenêtre, sinon elle resterait plantée devant du vide.
    const clamped = Math.max(minX, Math.min(0, x.get()));
    if (clamped !== x.get()) x.set(clamped);
  }, [minX, x]);

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!canScroll) return;
    // Souris et pavé tactile : un défilement, quel qu'en soit l'axe, parcourt
    // la main. Sur ordinateur, personne ne pense à « glisser » les cartes.
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    x.set(Math.max(minX, Math.min(0, x.get() - delta)));
  };

  const togglePreselect = (id: string) => {
    vibrate('select');
    // Retaper la même carte annule le choix ; en taper une autre le remplace.
    setPreselected((cur) => (cur === id ? null : id));
  };

  return (
    <div ref={ref} className="w-full px-1" data-testid="hand-fan">
      <div className="flex items-end justify-center" style={{ height: containerH }}>
        <div
          // `overflow-x: clip` (et non `auto`) : il cache ce qui dépasse à
          // gauche et à droite sans créer de conteneur de défilement — la page
          // ne peut donc pas déborder horizontalement, et la carte qu'on tire
          // vers le haut reste visible, elle, hors de la boîte.
          className={`relative shrink-0 ${canScroll ? 'overflow-x-clip' : ''}`}
          style={{ width: windowW, height: containerH }}
        >
          <motion.div
            className="relative h-full"
            style={{ width: trackW, x }}
            // Parcourir la main du doigt. `dragDirectionLock` sépare nettement
            // les deux gestes : un mouvement d'abord vertical tire la carte,
            // un mouvement d'abord horizontal fait défiler la main.
            drag={canScroll ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: minX, right: 0 }}
            dragElastic={0.06}
            onWheel={onWheel}
          >
            {hand.map((card, i) => {
              const id = cardId(card);
              const legal = myTurn && legalCardIds.includes(id);
              const isTrump =
                trumpSuit !== null && trumpSuit !== undefined && card.suit === trumpSuit;
              const isPreselected = preselected === id;
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
                  data-preselected={isPreselected ? 'true' : undefined}
                  className="absolute bottom-0"
                  // Les cartes tombent depuis le haut de la table, en éventail
                  initial={{ y: -220, opacity: 0, rotate: tilt - 18, scale: 0.9 }}
                  animate={{
                    y: legal || isPreselected ? -RAISE_PX : 0,
                    opacity: 1,
                    rotate: tilt,
                    scale: 1,
                  }}
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
                    // Le geste doit être franchement vertical : sans cette
                    // condition, parcourir une main étalée poserait une carte.
                    const vertical = Math.abs(info.offset.y) > Math.abs(info.offset.x);
                    if (legal && vertical && info.offset.y < -DRAG_TO_PLAY_PX) play(id);
                  }}
                  whileDrag={{ scale: 1.06, zIndex: 99 }}
                  style={{
                    left: i * step,
                    transformOrigin: 'bottom center',
                    marginBottom: maxLift - lift,
                    zIndex: isPreselected ? 60 : i,
                    touchAction: legal ? 'none' : undefined,
                  }}
                >
                  <CardFace
                    card={card}
                    width={cardW}
                    size={cardW >= 62 ? 'lg' : cardW >= 50 ? 'md' : 'sm'}
                    layoutId={`card-${id}`}
                    dimmed={myTurn && !legal}
                    raised={legal || isPreselected}
                    trump={isTrump}
                    onClick={
                      myTurn
                        ? legal
                          ? () => play(id)
                          : undefined
                        : // Hors de mon tour, taper une carte ne la joue pas :
                          // elle la réserve pour l'instant où le tour arrivera.
                          () => togglePreselect(id)
                    }
                  />
                  {legal && !isPreselected && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brass-300"
                    />
                  )}
                  {isPreselected && (
                    <>
                      {/* Vert et cerclé : impossible à confondre avec le laiton
                          discret d'une carte jouable maintenant. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-[3px] rounded-[10px] ring-2 ring-success"
                        style={{ boxShadow: '0 0 12px 2px rgb(75 163 111 / 0.45)' }}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-1.5 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-success text-[10px] font-bold leading-none text-felt-950"
                      >
                        ✓
                      </span>
                    </>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {canSpread && (
          <button
            type="button"
            data-testid="spread-toggle"
            aria-pressed={isSpread}
            aria-label={isSpread ? t.collapseHand : t.spreadHand}
            onClick={() => {
              vibrate('select');
              setSpreadWanted((s) => !s);
            }}
            className={`ml-1 flex shrink-0 items-center justify-center rounded-lg text-[13px] leading-none ring-1 transition active:scale-95 ${
              isSpread
                ? 'bg-brass-400/20 text-brass-200 ring-brass-400/40'
                : 'bg-felt-900/55 text-paper-50/60 ring-white/10'
            }`}
            style={{ width: TOGGLE_W, height: Math.min(containerH, 88) }}
          >
            <span aria-hidden="true">⇔</span>
          </button>
        )}
      </div>
    </div>
  );
}
