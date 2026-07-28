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

/**
 * Format de partie : détermine la longueur de la séquence de manches.
 * - `blitz`  : montée et descente écourtées (1 → 5 → 1)
 * - `normal` : montée et descente complètes (1 → max → 1) — comportement historique
 * - `climb`  : montée seule (1 → max), sans redescente
 */
export type GameFormat = 'blitz' | 'normal' | 'climb';

/**
 * Ordre d'affichage, du plus court au plus long. La Normale est toujours la
 * plus longue ; à 8 joueurs, Éclair (1→5→1) et Montante (1→6) se valent
 * presque, la table nombreuse rallongeant chaque manche.
 */
export const GAME_FORMATS: readonly GameFormat[] = ['blitz', 'climb', 'normal'];

export const DEFAULT_FORMAT: GameFormat = 'normal';

/** Sommet de la montée en format Éclair (plafonné par `maxCards`). */
export const BLITZ_PEAK = 5;

export function isGameFormat(value: unknown): value is GameFormat {
  return typeof value === 'string' && (GAME_FORMATS as readonly string[]).includes(value);
}

/** Nombre de cartes de la manche la plus fournie, selon le format. */
export function formatPeak(nbPlayers: number, format: GameFormat = DEFAULT_FORMAT): number {
  const m = maxCards(nbPlayers);
  return format === 'blitz' ? Math.min(BLITZ_PEAK, m) : m;
}

/**
 * Séquence des manches (nombre de cartes distribuées à chaque manche).
 * Par défaut : 1, 2, …, max, …, 2, 1 (format normal, rétrocompatible).
 */
export function roundsSequence(nbPlayers: number, format: GameFormat = DEFAULT_FORMAT): number[] {
  const peak = formatPeak(nbPlayers, format);
  const up = Array.from({ length: peak }, (_, i) => i + 1);
  if (format === 'climb') return up;
  const down = Array.from({ length: peak - 1 }, (_, i) => peak - 1 - i);
  return [...up, ...down];
}

/**
 * Estimation empirique du rythme de jeu, par joueur : le temps d'annoncer
 * une manche, puis celui de jouer une carte à chaque pli.
 */
const SECONDS_PER_BID = 6;
const SECONDS_PER_TRICK = 5;

export interface FormatSummary {
  format: GameFormat;
  /** Nombre de manches de la partie. */
  rounds: number;
  /** Nombre total de plis joués sur la partie. */
  tricks: number;
  /** Durée estimée, arrondie à 5 minutes près. */
  minutes: number;
}

/**
 * Nombre de manches, de plis et durée estimée d'un format.
 * Le nombre de joueurs est ramené au minimum jouable : dans un salon encore
 * incomplet, l'estimation reste celle de la partie qui sera réellement jouée.
 */
export function formatSummary(nbPlayers: number, format: GameFormat = DEFAULT_FORMAT): FormatSummary {
  const n = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, nbPlayers));
  const sequence = roundsSequence(n, format);
  const tricks = sequence.reduce((sum, cards) => sum + cards, 0);
  const seconds = n * (sequence.length * SECONDS_PER_BID + tricks * SECONDS_PER_TRICK);
  return {
    format,
    rounds: sequence.length,
    tricks,
    minutes: Math.max(5, Math.round(seconds / 300) * 5),
  };
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

/**
 * Barèmes de score.
 *
 * Chaque famille a le sien, et c'est une vraie source d'abandon : quelqu'un
 * qui compte autrement chez lui trouve le jeu « faux ». Trois barèmes couvrent
 * l'essentiel de ce qui se joue réellement.
 */
export const SCORING_VARIANTS = ['classic', 'gentle', 'always'] as const;
export type ScoringVariant = (typeof SCORING_VARIANTS)[number];
export const DEFAULT_SCORING: ScoringVariant = 'classic';

export function isScoringVariant(value: unknown): value is ScoringVariant {
  return typeof value === 'string' && (SCORING_VARIANTS as readonly string[]).includes(value);
}

/**
 * Score d'une manche.
 *
 * - `classic` : contrat exact → 10 + 2×plis ; raté → −2 par pli d'écart.
 *   Le barème d'origine : il récompense les gros contrats tenus et punit
 *   sèchement, donc les scores s'écartent vite.
 * - `gentle` : contrat exact → 10 + plis ; raté → 0. Aucune pénalité, personne
 *   ne décroche — la version qu'on sort en famille avec des débutants.
 * - `always` : on marque toujours ses plis, plus 10 si le contrat est exact.
 *   Rater reste rentable, ce qui pousse à jouer les plis plutôt qu'à les fuir.
 */
export function scoreRound(bid: number, tricks: number, variant: ScoringVariant = DEFAULT_SCORING): number {
  const exact = bid === tricks;
  switch (variant) {
    case 'gentle':
      return exact ? 10 + tricks : 0;
    case 'always':
      return tricks + (exact ? 10 : 0);
    default:
      return exact ? 10 + 2 * tricks : -2 * Math.abs(tricks - bid);
  }
}
