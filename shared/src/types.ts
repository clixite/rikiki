import type { GameFormat, GamePace, ScoringVariant } from './rules';

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
  /**
   * Photo de profil, en JPEG encodé en data URL (96×96, quelques kilo-octets).
   * `null` quand le joueur s'en tient à un avatar dessiné.
   */
  photo: string | null;
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

/**
 * Une partie en cours à laquelle le joueur participe.
 *
 * En temps réel, on n'en a qu'une à la fois et le bouton « reprendre » suffit.
 * En asynchrone on peut en avoir cinq, chacune en attente d'un autre joueur :
 * il faut donc pouvoir les lister et voir d'un coup d'œil laquelle attend
 * après nous.
 */
export interface ActiveGame {
  code: string;
  phase: Phase;
  pace: GamePace;
  playersCount: number;
  /** C'est à moi de jouer (annonce ou carte). */
  myTurn: boolean;
  /** Pseudo du joueur attendu, si la partie attend quelqu'un. */
  waitingFor: string | null;
  /** Numéro de la manche en cours, 1 pour la première. */
  round: number;
  roundsTotal: number;
  myScore: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* Groupes d'amis : classement cumulé sur les parties jouées ensemble   */
/* ------------------------------------------------------------------ */

/** Un groupe d'amis, tel qu'affiché dans « Mes groupes ». */
export interface Group {
  id: string;
  name: string;
  /** Code de partage à 6 lettres (distinct du code de partie à 4 lettres). */
  code: string;
  ownerId: string;
  createdAt: number;
  membersCount: number;
  gamesCount: number;
}

export interface GroupMember {
  userId: string;
  pseudo: string;
  avatar: string;
  joinedAt: number;
  isOwner: boolean;
}

/** Une ligne du classement cumulé du groupe. */
export interface GroupStanding {
  userId: string;
  pseudo: string;
  avatar: string;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
}

/** Une partie du groupe, avec le résultat de chaque participant. */
export interface GroupGame {
  code: string;
  playedAt: number;
  results: { userId: string; pseudo: string; avatar: string; score: number; rank: number; won: boolean }[];
}

export interface GroupDetail {
  group: Group;
  members: GroupMember[];
  standings: GroupStanding[];
  recentGames: GroupGame[];
}

export interface Player {
  id: string;
  pseudo: string;
  avatar: string;
  /** Photo de profil (data URL JPEG) ; absente pour un avatar dessiné ou un robot. */
  photo?: string | null;
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
  /**
   * Cartes déjà tombées dans la manche, plis achevés compris.
   *
   * Information publique — tout le monde les a vues — mais que l'état ne
   * conservait pas : un joueur automatique ne pouvait donc pas savoir si son
   * Roi était devenu maître. Absente des états persistés avant la v1.2, d'où
   * les lectures défensives.
   */
  playedCards: Card[];
  tricksWon: Record<string, number>;
  roundScores: Record<string, number> | null;
}

export interface GameState {
  code: string;
  hostId: string;
  phase: Phase;
  players: Player[];
  maxPlayers: number;
  /** Format choisi par l'hôte dans le salon (durée de la partie). */
  format: GameFormat;
  /**
   * Barème de score choisi par l'hôte. Absent des parties créées avant la
   * v1.3 : toute lecture retombe sur le barème classique.
   */
  scoring?: ScoringVariant;
  /**
   * Rythme choisi par l'hôte. Absent des parties créées avant la v1.3 : toute
   * lecture retombe sur le temps réel, le seul rythme qui existait alors.
   */
  pace?: GamePace;
  roundsSequence: number[];
  round: RoundState | null;
  createdAt: number;
  seed: string;
  /**
   * Groupe d'amis auquel rattacher les résultats en fin de partie.
   * Choisi par l'hôte dans le salon (`room:setGroup`) ; `null` ou absent =
   * partie amicale non comptabilisée dans un classement de groupe.
   */
  groupId?: string | null;
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
  /**
   * Horodatage (ms) auquel le joueur attendu sera joué automatiquement.
   *
   * Calculé par le serveur à chaque changement de tour, jamais persisté : une
   * échéance ressuscitée après un redémarrage n'aurait aucun sens. `null`
   * quand personne n'est attendu, ou quand le tour est celui d'un robot.
   */
  turnDeadline?: number | null;
}
