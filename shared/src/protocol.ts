import type { EngineErrorCode } from './engine';
import type { GameFormat, ScoringVariant } from './rules';
import type { CardId, GameView } from './types';

export type ErrorCode =
  | EngineErrorCode
  | 'ROOM_NOT_FOUND'
  | 'GAME_ALREADY_STARTED'
  | 'ALREADY_IN_ROOM'
  | 'NOT_IN_ROOM'
  | 'INVALID_TOKEN'
  | 'INVALID_PAYLOAD';

export interface ProtocolError {
  code: ErrorCode;
  message: string;
}

export type Ack<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: ProtocolError };

/** Événements transitoires pour animations/notifications côté client. */
export type TransientEvent =
  | { type: 'player-joined'; playerId: string; pseudo: string }
  | { type: 'player-left'; playerId: string; pseudo: string }
  | { type: 'bid-placed'; playerId: string; bid: number }
  | { type: 'card-played'; playerId: string; cardId: CardId }
  | { type: 'trick-won'; playerId: string }
  | { type: 'round-scored' }
  | { type: 'player-disconnected'; playerId: string; graceSeconds: number }
  | { type: 'player-reconnected'; playerId: string }
  | { type: 'host-changed'; hostId: string }
  | { type: 'rematch'; code: string }
  | { type: 'emote'; playerId: string; emote: EmoteId };

/**
 * Réactions envoyables à la table.
 *
 * Une partie entre amis se joue autant en chambrant qu'en comptant les plis.
 * Une liste courte et fermée suffit : elle se traduit toute seule, ne demande
 * aucune modération, et ne peut pas servir de messagerie détournée.
 */
export const EMOTES = ['clap', 'slap', 'kiss', 'laugh', 'cry', 'fire', 'think', 'wow'] as const;
export type EmoteId = (typeof EMOTES)[number];

export function isEmoteId(value: unknown): value is EmoteId {
  return typeof value === 'string' && (EMOTES as readonly string[]).includes(value);
}

export interface ClientToServerEvents {
  'room:create': (ack: (res: Ack<{ code: string }>) => void) => void;
  'room:join': (payload: { code: string }, ack: (res: Ack<{ code: string }>) => void) => void;
  'room:leave': (ack: (res: Ack) => void) => void;
  'room:kick': (payload: { playerId: string }, ack: (res: Ack) => void) => void;
  /** Ajoute un joueur automatique (hôte, lobby uniquement). */
  'room:addBot': (ack: (res: Ack<{ playerId: string }>) => void) => void;
  /** Retire un joueur automatique (hôte, lobby uniquement). */
  'room:removeBot': (payload: { playerId: string }, ack: (res: Ack) => void) => void;
  /** Choisit le format de la partie (hôte, lobby uniquement) — diffusé à tout le salon. */
  'room:setFormat': (payload: { format: GameFormat }, ack: (res: Ack) => void) => void;
  /** Choisit le barème de score (hôte, lobby uniquement). */
  'room:setScoring': (payload: { scoring: ScoringVariant }, ack: (res: Ack) => void) => void;
  /**
   * Rattache la partie à un groupe d'amis (hôte, lobby uniquement).
   * `null` détache la partie de tout groupe. L'hôte doit être membre du groupe.
   */
  'room:setGroup': (payload: { groupId: string | null }, ack: (res: Ack) => void) => void;
  'room:rematch': (ack: (res: Ack<{ code: string }>) => void) => void;
  'game:start': (ack: (res: Ack) => void) => void;
  'game:bid': (payload: { bid: number }, ack: (res: Ack) => void) => void;
  'game:playCard': (payload: { cardId: CardId }, ack: (res: Ack) => void) => void;
  'game:nextRound': (ack: (res: Ack) => void) => void;
  'profile:update': (payload: { pseudo: string; avatar: string }, ack: (res: Ack) => void) => void;
  /** Réaction envoyée à la table (limitée côté serveur). */
  'game:emote': (payload: { emote: EmoteId }, ack: (res: Ack) => void) => void;
}

export interface ServerToClientEvents {
  'game:view': (view: GameView) => void;
  'game:event': (event: TransientEvent) => void;
  'room:closed': (payload: { reason: string }) => void;
}
