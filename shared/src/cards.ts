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

const SUIT_ORDER: Record<Suit, number> = { S: 0, H: 1, C: 2, D: 3 };

/** Tri d'affichage : par couleur (atout en dernier), rang croissant. */
export function sortHand(hand: readonly Card[], trump: Suit | null): Card[] {
  return [...hand].sort((a, b) => {
    const sa = a.suit === trump ? 4 : SUIT_ORDER[a.suit];
    const sb = b.suit === trump ? 4 : SUIT_ORDER[b.suit];
    if (sa !== sb) return sa - sb;
    return a.rank - b.rank;
  });
}
