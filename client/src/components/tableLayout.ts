import { useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';

/**
 * Géométrie du tapis.
 *
 * Les positions étaient jusqu'ici des pourcentages écrits à la main, un jeu par
 * nombre de joueurs. À huit sur un petit téléphone, le résultat était
 * intenable : sièges à cheval sur les bords, adversaires masqués par le
 * cartouche d'atout, et un pli en `flex-wrap` qui repliait ses cartes sur trois
 * rangées par-dessus tout le monde.
 *
 * Tout est donc calculé depuis la taille réelle du feutre, en deux bandes :
 *
 *  - en haut, les sièges sur un arc surbaissé — rien ne sort du tapis, rien ne
 *    chevauche son voisin ;
 *  - en dessous, les cartes jouées, chacune alignée SOUS son propriétaire.
 *
 * Cet alignement est ce qui remplace l'étiquette au pseudo : on lit qui a joué
 * quoi à la position, comme sur une vraie table. Il a un autre mérite — les
 * sièges tiennent toujours dans la largeur, donc les cartes aussi, quel que
 * soit le nombre de joueurs.
 */

export interface Point {
  x: number;
  y: number;
}

export interface FeltLayout {
  /** Centre de chaque siège adverse, dans l'ordre du tour à partir de moi. */
  seats: Point[];
  /** Centre de la carte jouée par chaque adversaire (mêmes indices). */
  slots: Point[];
  /** Centre de ma propre carte jouée : au centre, décalée vers le bas. */
  mySlot: Point;
  /** Centre de la bande des cartes jouées (ancrage visuel, emplacement vide). */
  centre: Point;
  seatW: number;
  seatH: number;
  /** Largeur d'une carte posée sur le tapis. */
  trickCardW: number;
  /** Hauteur correspondante (ratio 2:3 des cartes réelles). */
  trickCardH: number;
  /** Diamètre de l'avatar d'un adversaire. */
  avatar: number;
  /** Le pseudo tient-il sous l'avatar, ou la table est-elle trop serrée ? */
  showName: boolean;
}

const PAD = 4;
/** Respiration minimale entre deux sièges voisins. */
const GUTTER = 6;
/**
 * Hauteur réellement occupée par un siège : l'avatar, le pseudo, la pastille de
 * contrat, plus la marge que prend l'agrandissement du joueur dont c'est le
 * tour. Sous-estimer cette valeur faisait mordre le pli sur les sièges.
 */
const seatHeight = (avatar: number, withName: boolean): number =>
  // Sans pseudo permanent, on réserve tout de même de quoi nommer le joueur
  // dont c'est le tour : sinon son nom flotte par-dessus les cartes du pli.
  avatar + (withName ? 58 : 50);
/**
 * Bande réservée en bas du tapis : la ligne d'état (« au tour de… ») et le
 * bouton des réactions y vivent. Rien du pli ne doit y descendre, sinon le
 * texte passe sous une carte et le bouton devient inatteignable.
 */
export const STATUS_H = 52;
/** Part de la hauteur d'une carte dont celle du joueur dépasse vers le bas. */
const MY_CARD_DROP = 0.55;
export const CARD_RATIO = 1.5;
const CARD_W_MAX = 66;
const CARD_W_MIN = 38;
/**
 * Part de la carte occupée par l'index du coin haut-gauche (rang et enseigne).
 * C'est la seule zone dont la visibilité soit indispensable : tant qu'elle est
 * dégagée, une carte partiellement recouverte reste identifiable.
 */
export const INDEX_W = 0.42;
export const INDEX_H = 0.34;
/**
 * Recouvrement maximal entre deux cartes voisines. Un tiers caché ne gêne pas :
 * l'index du coin haut-gauche reste lu, et l'ordre d'empilement va de gauche à
 * droite, donc c'est toujours le bord droit qui disparaît — jamais le rang.
 */
const MAX_OVERLAP = 0.42;

/** Mesure vivante d'un élément : la géométrie suit les rotations d'écran. */
export function useElementSize<T extends HTMLElement>(): [
  MutableRefObject<T | null>,
  { width: number; height: number },
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/**
 * Dispose `n` adversaires sur un arc surbaissé, du bas-gauche au bas-droit en
 * passant par le sommet — soi-même occupant le bas de l'écran.
 *
 * Le rayon horizontal retire une demi-largeur de siège : le siège le plus à
 * gauche affleure le bord sans jamais le franchir, quel que soit l'écran.
 */
export function feltLayout(n: number, width: number, height: number): FeltLayout {
  /*
   * Largeur d'un siège.
   *
   * Les sièges étaient répartis selon le cosinus de leur angle, comme sur une
   * vraie ellipse. C'est joli et c'est faux : le cosinus resserre les positions
   * aux extrémités de l'arc, si bien qu'à cinq joueurs sur un écran étroit les
   * deux sièges de gauche se chevauchaient. On répartit donc les abscisses
   * uniformément — la courbe vient de l'ordonnée — et on choisit la largeur de
   * siège de façon qu'aucun ne puisse toucher son voisin :
   *
   *     n × seatW + (n−1) × GUTTER ≤ largeur utile
   *
   * La gouttière n'est pas cosmétique : sans elle, deux sièges finissent
   * exactement bord à bord, et le moindre arrondi les fait se toucher.
   */
  const seatW =
    n > 0
      ? clamp(
          Math.min(width / Math.max(3.4, n * 0.66), (width - 2 * PAD - (n - 1) * GUTTER) / n),
          44,
          104,
        )
      : 0;
  // Sous une certaine largeur, le pseudo n'est plus qu'une bouillie de trois
  // lettres : mieux vaut ne garder que l'avatar, qui identifie déjà le joueur —
  // et qui peut alors occuper toute la largeur du siège.
  const showName = seatW >= 56;
  const avatar = showName ? (n >= 6 ? 38 : n >= 4 ? 42 : 48) : clamp(seatW - 6, 30, 46);
  const seatH = seatHeight(avatar, showName);

  const cx = width / 2;
  const xLeft = seatW / 2 + PAD;
  const xRight = Math.max(xLeft, width - seatW / 2 - PAD);
  // Arc surbaissé : les sièges doivent tenir dans le haut du tapis pour laisser
  // au pli une bande entière. Un arc trop bombé repousserait les cartes dehors.
  const ry = clamp(height * 0.2, 24, Math.max(24, height * 0.5 - seatH));
  const cy = PAD + seatH / 2 + ry;

  /** Position relative d'un siège, de 0 (ma gauche) à 1 (ma droite). */
  const t = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  const seats: Point[] = [];
  for (let i = 0; i < n; i++) {
    seats.push({ x: xLeft + t(i) * (xRight - xLeft), y: cy - ry * Math.sin(Math.PI * t(i)) });
  }

  // Bande des cartes jouées : tout ce qui reste sous le siège le plus bas.
  const seatBottom = seats.length > 0 ? Math.max(...seats.map((s) => s.y)) + seatH / 2 : PAD;
  const bandTop = seatBottom + 6;
  const bandH = Math.max(0, height - bandTop - STATUS_H);

  // Écart entre deux sièges voisins : c'est lui qui décide de la taille des
  // cartes, puisque chacune se pose sous le sien.
  const gap = seats.length > 1 ? (xRight - xLeft) / (n - 1) : width;

  const trickCardW = clamp(
    Math.min(gap / (1 - MAX_OVERLAP), bandH / ((1 + MY_CARD_DROP) * CARD_RATIO)),
    CARD_W_MIN,
    CARD_W_MAX,
  );
  const cardH = trickCardW * CARD_RATIO;
  // La bande se centre dans la place restante : collée sous les sièges, elle
  // laissait un large vide en bas du tapis. Sur un tapis trop court pour la
  // contenir, on la rabat dans les bornes plutôt que de la laisser déborder.
  const stackH = cardH * (1 + MY_CARD_DROP);
  const rowY = clamp(
    bandTop + Math.max(0, (bandH - stackH) / 2) + cardH / 2,
    cardH / 2,
    Math.max(cardH / 2, height - cardH * (0.5 + MY_CARD_DROP)),
  );

  // Les cartes s'alignent sur leur siège, en restant dans le tapis.
  const slots: Point[] = seats.map((s) => ({
    x: clamp(s.x, trickCardW / 2 + PAD, width - trickCardW / 2 - PAD),
    y: rowY,
  }));

  return {
    seats,
    slots,
    // Ma carte arrive par le bas et passe devant : elle vient d'être jetée.
    mySlot: { x: cx, y: rowY + cardH * MY_CARD_DROP },
    centre: { x: cx, y: rowY },
    seatW,
    seatH,
    showName,
    trickCardW,
    trickCardH: cardH,
    avatar,
  };
}
