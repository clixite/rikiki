import type { Card, Suit, Trick, TrickPlay } from './types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;

/**
 * Nombre max de cartes par joueur. Le /51 garantit qu'il reste
 * toujours au moins une carte à retourner pour l'atout.
 */
export function maxCards(nbPlayers: number): number {
  return Math.min(10, Math.floor(51 / nbPlayers));
}

/** Séquence des manches : 1, 2, …, max, …, 2, 1. */
export function roundsSequence(nbPlayers: number): number[] {
  const m = maxCards(nbPlayers);
  const up = Array.from({ length: m }, (_, i) => i + 1);
  const down = Array.from({ length: m - 1 }, (_, i) => m - 1 - i);
  return [...up, ...down];
}

/**
 * Enchères autorisées. Règle du crochet : le dernier enchérisseur ne peut
 * pas amener le total des annonces au nombre exact de plis de la manche.
 */
export function legalBids(cardsCount: number, otherBidsSum: number, isLastBidder: boolean): number[] {
  const bids: number[] = [];
  for (let b = 0; b <= cardsCount; b++) {
    if (isLastBidder && otherBidsSum + b === cardsCount) continue;
    bids.push(b);
  }
  return bids;
}

export function ledSuit(trick: Trick): Suit | null {
  return trick.plays.length > 0 ? trick.plays[0].card.suit : null;
}

/**
 * Cartes jouables : fournir la couleur demandée si possible,
 * sinon n'importe quelle carte (pas d'obligation de couper).
 */
export function legalCards(hand: readonly Card[], trick: Trick): Card[] {
  const led = ledSuit(trick);
  if (led === null) return [...hand];
  const following = hand.filter((c) => c.suit === led);
  return following.length > 0 ? following : [...hand];
}

/** Gagnant du pli : plus haut atout, sinon plus haute carte de la couleur demandée. */
export function trickWinner(trick: Trick, trump: Suit | null): TrickPlay {
  const led = ledSuit(trick);
  if (led === null) throw new Error('Pli vide');
  let best = trick.plays[0];
  for (const play of trick.plays.slice(1)) {
    const bestIsTrump = trump !== null && best.card.suit === trump;
    const playIsTrump = trump !== null && play.card.suit === trump;
    if (playIsTrump && !bestIsTrump) {
      best = play;
    } else if (playIsTrump === bestIsTrump && play.card.suit === best.card.suit && play.card.rank > best.card.rank) {
      best = play;
    }
  }
  return best;
}

/** Score de manche : contrat exact → 10 + 2×plis ; raté → −2 par pli d'écart. */
export function scoreRound(bid: number, tricks: number): number {
  return bid === tricks ? 10 + 2 * tricks : -2 * Math.abs(tricks - bid);
}
