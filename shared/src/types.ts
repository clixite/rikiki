export type Suit = 'S' | 'H' | 'D' | 'C';
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface Card {
  suit: Suit;
  rank: Rank;
}

/** Identifiant compact d'une carte, ex. "S14" = as de pique. */
export type CardId = string;

export interface PublicUser {
  id: string;
  pseudo: string;
  avatar: string;
  email: string | null;
  isGuest: boolean;
}

/** Une partie terminée, telle qu'affichée dans l'historique d'un joueur. */
export interface GameHistoryEntry {
  code: string;
  playedAt: number;
  playersCount: number;
  myScore: number;
  myRank: number;
  won: boolean;
  standings: { pseudo: string; avatar: string; score: number }[];
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  bestRound: number;
}

export interface Player {
  id: string;
  pseudo: string;
  avatar: string;
  seat: number;
  connected: boolean;
  totalScore: number;
}

export type Phase = 'lobby' | 'bidding' | 'playing' | 'round-scoring' | 'game-over';

export interface TrickPlay {
  playerId: string;
  card: Card;
}

export interface Trick {
  leaderSeat: number;
  plays: TrickPlay[];
}

export interface CompletedTrick extends Trick {
  winnerId: string;
}

export interface RoundState {
  roundIndex: number;
  cardsCount: number;
  dealerSeat: number;
  trumpCard: Card | null;
  /** Mains complètes — côté serveur uniquement, jamais diffusées telles quelles. */
  hands: Record<string, Card[]>;
  bids: Record<string, number | null>;
  /** Siège du joueur attendu (enchère ou carte selon la phase). */
  currentSeat: number;
  currentTrick: Trick;
  lastTrick: CompletedTrick | null;
  tricksWon: Record<string, number>;
  roundScores: Record<string, number> | null;
}

export interface GameState {
  code: string;
  hostId: string;
  phase: Phase;
  players: Player[];
  maxPlayers: number;
  roundsSequence: number[];
  round: RoundState | null;
  createdAt: number;
  seed: string;
}

/** Manche telle que vue par UN joueur (anti-triche : pas les mains adverses). */
export interface RoundView extends Omit<RoundState, 'hands'> {
  myHand: Card[];
  handCounts: Record<string, number>;
  /** Enchères autorisées si c'est mon tour d'enchérir, sinon null. */
  legalBids: number[] | null;
  /** Cartes jouables si c'est mon tour de jouer, sinon null. */
  legalCardIds: CardId[] | null;
}

export interface GameView extends Omit<GameState, 'round' | 'seed'> {
  /** Mon playerId dans cette partie. */
  you: string;
  round: RoundView | null;
}
