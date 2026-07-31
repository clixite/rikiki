import type { Card, CardId, Rank, Suit } from './types';
import { RANKS, SUITS } from './types';

export function cardId(card: Card): CardId {
  return `${card.suit}${card.rank}`;
}

export function cardFromId(id: CardId): Card {
  const suit = id[0] as Suit;
  const rank = Number(id.slice(1)) as Rank;
  if (!SUITS.includes(suit) || !RANKS.includes(rank)) {
    throw new Error(`Carte invalide: ${id}`);
  }
  return { suit, rank };
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Hash d'une chaîne vers un entier 32 bits (xmur3). */
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** PRNG déterministe mulberry32. */
export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, renvoie un nouveau tableau. */
export function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ordre de référence des couleurs rouges, puis des noires (déterminisme). */
const RED_SUITS: readonly Suit[] = ['H', 'D'];
const BLACK_SUITS: readonly Suit[] = ['S', 'C'];

/** ♥ et ♦ sont rouges, ♠ et ♣ sont noirs. */
export function isRedSuit(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

/** Place `trump` en tête de sa liste de teinte, sans changer l'ordre relatif du reste. */
function promoteTrump(suits: readonly Suit[], trump: Suit | null): Suit[] {
  if (trump === null || !suits.includes(trump)) return [...suits];
  return [trump, ...suits.filter((s) => s !== trump)];
}

/**
 * Tri d'affichage de la main.
 *
 * Règles :
 *  1. Les cartes d'une même couleur restent groupées et sont triées par rang
 *     croissant (2 → As).
 *  2. Les groupes de couleurs alternent rouge / noir autant que possible, pour
 *     qu'on ne trouve jamais deux teintes identiques côte à côte si un autre
 *     agencement l'évite (lecture rapide sur petit écran).
 *
 * Algorithme :
 *  - on répartit les couleurs présentes en deux listes (rouges, noires) suivant
 *    un ordre de référence fixe, ce qui garantit le déterminisme ;
 *  - la teinte **majoritaire** ouvre la main, puis on intercale une couleur de
 *    chaque liste à tour de rôle. Commencer par la majorité est la seule façon
 *    d'obtenir la meilleure alternance possible :
 *      • 2 rouges + 2 noires → R/N/R/N (alternance stricte) ;
 *      • 2 rouges + 1 noire  → R/N/R ;
 *      • 1 rouge  + 1 noire  → R/N ;
 *      • 2 couleurs de même teinte → collage inévitable, on les laisse groupées.
 *
 * Rôle de l'atout : il n'est **plus relégué en fin de main** (il est mis en
 * évidence ailleurs dans l'interface). Il sert de point de départ stable à
 * l'alternance : s'il est présent en main, il ouvre sa propre teinte, et en cas
 * d'égalité du nombre de couleurs rouges et noires c'est sa teinte qui ouvre la
 * main. Sans atout en main, l'égalité retombe sur l'ordre historique ♠ ♥ ♣ ♦.
 * Le résultat ne dépend que de la main et de l'atout : deux appels identiques
 * donnent exactement le même ordre.
 */
export function sortHand(hand: readonly Card[], trump: Suit | null): Card[] {
  if (hand.length <= 1) return [...hand];

  // 1. Regroupement par couleur, rang croissant à l'intérieur de chaque groupe.
  const groups = new Map<Suit, Card[]>();
  for (const card of hand) {
    const group = groups.get(card.suit);
    if (group) group.push(card);
    else groups.set(card.suit, [card]);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.rank - b.rank);
  }

  // 2. Couleurs présentes, par teinte, dans l'ordre de référence — l'atout
  //    éventuel passant en tête de sa teinte.
  const reds = promoteTrump(
    RED_SUITS.filter((s) => groups.has(s)),
    trump,
  );
  const blacks = promoteTrump(
    BLACK_SUITS.filter((s) => groups.has(s)),
    trump,
  );

  // 3. Quelle teinte ouvre la main ?
  let first: Suit[];
  let second: Suit[];
  if (reds.length !== blacks.length) {
    // La teinte majoritaire commence, sinon elle finirait avec deux groupes collés.
    [first, second] = reds.length > blacks.length ? [reds, blacks] : [blacks, reds];
  } else if (trump !== null && groups.has(trump)) {
    // Égalité : l'atout sert d'ancre et ouvre la main.
    [first, second] = isRedSuit(trump) ? [reds, blacks] : [blacks, reds];
  } else {
    // Égalité sans atout en main : ordre historique ♠ ♥ ♣ ♦.
    [first, second] = [blacks, reds];
  }

  // 4. Intercalage des deux listes (le surplus de la majorité suit naturellement).
  const suitOrder: Suit[] = [];
  const longest = Math.max(first.length, second.length);
  for (let i = 0; i < longest; i++) {
    if (i < first.length) suitOrder.push(first[i]);
    if (i < second.length) suitOrder.push(second[i]);
  }

  // 5. Concaténation des groupes dans l'ordre de couleurs calculé.
  const sorted: Card[] = [];
  for (const suit of suitOrder) {
    sorted.push(...(groups.get(suit) as Card[]));
  }
  return sorted;
}
