import { cardId } from './cards';
import { ledSuit, legalBids, legalCards, trickWinner } from './rules';
import type { Card, CardId, GameState, Player, Suit, Trick } from './types';

/* ------------------------------------------------------------------ */
/* Identité des joueurs automatiques                                   */
/* ------------------------------------------------------------------ */

/** Préfixe des identifiants de bots — jamais collisionnable avec un uuid utilisateur. */
export const BOT_ID_PREFIX = 'bot:';

export function isBotId(id: string): boolean {
  return id.startsWith(BOT_ID_PREFIX);
}

export type BotProfile = Pick<Player, 'id' | 'pseudo' | 'avatar'>;

/** Panel de robots (7 suffisent : 1 humain + 7 bots = 8 joueurs max). */
export const BOT_PROFILES: readonly BotProfile[] = [
  { id: `${BOT_ID_PREFIX}ada`, pseudo: 'Ada', avatar: '🤖' },
  { id: `${BOT_ID_PREFIX}turing`, pseudo: 'Turing', avatar: '🦾' },
  { id: `${BOT_ID_PREFIX}marvin`, pseudo: 'Marvin', avatar: '🛸' },
  { id: `${BOT_ID_PREFIX}blaise`, pseudo: 'Blaise', avatar: '⚙️' },
  { id: `${BOT_ID_PREFIX}grace`, pseudo: 'Grace', avatar: '🧠' },
  { id: `${BOT_ID_PREFIX}nono`, pseudo: 'Nono', avatar: '🔩' },
  { id: `${BOT_ID_PREFIX}hedy`, pseudo: 'Hedy', avatar: '📡' },
];

/** Premier profil de robot encore libre (déterministe, jamais aléatoire). */
export function nextBotProfile(takenIds: readonly string[]): BotProfile {
  const taken = new Set(takenIds);
  const free = BOT_PROFILES.find((p) => !taken.has(p.id));
  if (free) return free;
  let n = BOT_PROFILES.length + 1;
  while (taken.has(`${BOT_ID_PREFIX}r${n}`)) n++;
  return { id: `${BOT_ID_PREFIX}r${n}`, pseudo: `Robot ${n}`, avatar: '🤖' };
}

/* ------------------------------------------------------------------ */
/* Outils de comparaison de cartes                                     */
/* ------------------------------------------------------------------ */

function isTrump(card: Card, trump: Suit | null): boolean {
  return trump !== null && card.suit === trump;
}

/** `candidate` prend-elle la main sur la carte maîtresse actuelle du pli ? */
function beats(candidate: Card, best: Card, trump: Suit | null): boolean {
  const c = isTrump(candidate, trump);
  const b = isTrump(best, trump);
  if (c !== b) return c;
  if (candidate.suit !== best.suit) return false;
  return candidate.rank > best.rank;
}

/** Coût d'une carte : on se sépare en priorité des petites cartes hors atout. */
function cost(card: Card, trump: Suit | null): number {
  return (isTrump(card, trump) ? 100 : 0) + card.rank;
}

/** Valeur de défausse : on jette en priorité une grosse carte hors atout. */
function dumpValue(card: Card, trump: Suit | null): number {
  return isTrump(card, trump) ? card.rank : 100 + card.rank;
}

/**
 * Force d'entame quand le bot cherche des plis : les gros atouts passent
 * devant l'as sec d'une couleur ordinaire, qui passe devant les petits atouts.
 */
function leadPower(card: Card, trump: Suit | null): number {
  if (isTrump(card, trump)) return 24 + card.rank;
  if (card.rank === 14) return 34;
  if (card.rank === 13) return 15;
  return card.rank;
}

/** Argmax déterministe : à égalité, la première carte de la liste gagne. */
function pick(cards: readonly Card[], score: (c: Card) => number): Card {
  let best = cards[0];
  let bestScore = score(best);
  for (const c of cards.slice(1)) {
    const s = score(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Annonce                                                             */
/* ------------------------------------------------------------------ */

export interface BotBidInput {
  /** Main du bot pour cette manche. */
  hand: readonly Card[];
  trump: Suit | null;
  cardsCount: number;
  nbPlayers: number;
  /** Annonces autorisées (règle du crochet déjà appliquée). */
  legalBids: readonly number[];
}

/**
 * Espérance de plis d'une main : somme des probabilités estimées carte par carte.
 *
 * - atout : linéaire du 2 (0.35) à l'as (0.90) — même un petit atout coupe parfois ;
 * - as : quasi maître, sauf coupe adverse ;
 * - roi/dame/valet : d'autant plus sûrs qu'ils sont accompagnés (couleur longue) ;
 * - le tout pondéré par le nombre d'adversaires (plus on est nombreux, plus ça coupe).
 */
export function estimateTricks(hand: readonly Card[], trump: Suit | null, nbPlayers: number): number {
  const suitLengths = new Map<Suit, number>();
  for (const c of hand) suitLengths.set(c.suit, (suitLengths.get(c.suit) ?? 0) + 1);

  // 3 joueurs → 1 ; 8 joueurs → 0.75
  const oppFactor = Math.max(0.6, 1 - 0.05 * (nbPlayers - 3));

  let total = 0;
  for (const card of hand) {
    if (isTrump(card, trump)) {
      total += 0.35 + ((card.rank - 2) / 12) * 0.55;
      continue;
    }
    const len = suitLengths.get(card.suit) ?? 1;
    let p: number;
    if (card.rank === 14) p = 0.85;
    else if (card.rank === 13) p = len >= 2 ? 0.55 : 0.3;
    else if (card.rank === 12) p = len >= 3 ? 0.3 : 0.12;
    else if (card.rank === 11) p = len >= 4 ? 0.15 : 0.05;
    else p = 0.03;
    total += p * oppFactor;
  }
  return total;
}

/** Annonce légale la plus proche de `target` ; à égalité on prend la plus basse (prudence). */
function nearestLegalBid(target: number, legal: readonly number[]): number {
  let best = legal[0];
  let bestDist = Math.abs(best - target);
  for (const b of legal.slice(1)) {
    const d = Math.abs(b - target);
    if (d < bestDist) {
      best = b;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Annonce du bot : estimation arrondie, bornée à [0, cardsCount], puis ramenée
 * sur la valeur légale la plus proche (la règle du crochet peut l'interdire).
 */
export function chooseBid(input: BotBidInput): number {
  if (input.legalBids.length === 0) throw new Error('Aucune annonce légale');
  const raw = estimateTricks(input.hand, input.trump, input.nbPlayers);
  const target = Math.max(0, Math.min(input.cardsCount, Math.round(raw)));
  return nearestLegalBid(target, input.legalBids);
}

/* ------------------------------------------------------------------ */
/* Choix de carte                                                      */
/* ------------------------------------------------------------------ */

export interface BotCardInput {
  /** Cartes jouables (résultat de `legalCards`). */
  legal: readonly Card[];
  /** Pli en cours (éventuellement vide si le bot entame). */
  trick: Trick;
  trump: Suit | null;
  /** Contrat annoncé par le bot pour la manche. */
  bid: number;
  /** Plis déjà remportés par le bot dans la manche. */
  tricksWon: number;
}

/**
 * Choix de carte piloté par le contrat :
 * - s'il manque des plis, le bot essaie de prendre au meilleur marché (et coupe au besoin) ;
 * - si le contrat est atteint, il cherche à perdre : défausse haute qui ne prend pas,
 *   entame basse, et surtout pas de coupe inutile.
 */
export function chooseCard(input: BotCardInput): CardId {
  const { legal, trick, trump } = input;
  if (legal.length === 0) throw new Error('Aucune carte jouable');
  const wantTrick = input.bid - input.tricksWon > 0;

  // Entame : rien à battre, on choisit selon l'intention.
  if (ledSuit(trick) === null) {
    return cardId(wantTrick ? pick(legal, (c) => leadPower(c, trump)) : pick(legal, (c) => -cost(c, trump)));
  }

  const best = trickWinner(trick, trump).card;
  const winners = legal.filter((c) => beats(c, best, trump));

  if (wantTrick) {
    // La carte la moins chère qui prend la main ; sinon on jette la plus petite.
    const pool = winners.length > 0 ? winners : legal;
    return cardId(pick(pool, (c) => -cost(c, trump)));
  }

  const losers = legal.filter((c) => !beats(c, best, trump));
  if (losers.length > 0) {
    // On se débarrasse d'une grosse carte qui ne peut plus prendre le pli.
    return cardId(pick(losers, (c) => dumpValue(c, trump)));
  }
  // Obligé de dépasser : la plus petite, pour laisser les suivants repasser devant.
  return cardId(pick(legal, (c) => -cost(c, trump)));
}

/* ------------------------------------------------------------------ */
/* Adaptateurs sur le GameState (utilisés par le serveur)              */
/* ------------------------------------------------------------------ */

/** Annonce du bot `playerId` dans l'état courant (phase `bidding`). */
export function botBid(state: GameState, playerId: string): number {
  const round = state.round!;
  const others = Object.entries(round.bids).filter(([id]) => id !== playerId);
  const otherSum = others.reduce((sum, [, b]) => sum + (b ?? 0), 0);
  const isLast = others.every(([, b]) => b !== null);
  return chooseBid({
    hand: round.hands[playerId] ?? [],
    trump: round.trumpCard?.suit ?? null,
    cardsCount: round.cardsCount,
    nbPlayers: state.players.length,
    legalBids: legalBids(round.cardsCount, otherSum, isLast),
  });
}

/** Carte jouée par le bot `playerId` dans l'état courant (phase `playing`). */
export function botCard(state: GameState, playerId: string): CardId {
  const round = state.round!;
  return chooseCard({
    legal: legalCards(round.hands[playerId] ?? [], round.currentTrick),
    trick: round.currentTrick,
    trump: round.trumpCard?.suit ?? null,
    bid: round.bids[playerId] ?? 0,
    tricksWon: round.tricksWon[playerId] ?? 0,
  });
}
