import type { EngineErrorCode } from './engine';
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
  | { type: 'rematch'; code: string };

export interface ClientToServerEvents {
  'room:create': (ack: (res: Ack<{ code: string }>) => void) => void;
  'room:join': (payload: { code: string }, ack: (res: Ack<{ code: string }>) => void) => void;
  'room:leave': (ack: (res: Ack) => void) => void;
  'room:kick': (payload: { playerId: string }, ack: (res: Ack) => void) => void;
  /** Ajoute un joueur automatique (hôte, lobby uniquement). */
  'room:addBot': (ack: (res: Ack<{ playerId: string }>) => void) => void;
  /** Retire un joueur automatique (hôte, lobby uniquement). */
  'room:removeBot': (payload: { playerId: string }, ack: (res: Ack) => void) => void;
  'room:rematch': (ack: (res: Ack<{ code: string }>) => void) => void;
  'game:start': (ack: (res: Ack) => void) => void;
  'game:bid': (payload: { bid: number }, ack: (res: Ack) => void) => void;
  'game:playCard': (payload: { cardId: CardId }, ack: (res: Ack) => void) => void;
  'game:nextRound': (ack: (res: Ack) => void) => void;
  'profile:update': (payload: { pseudo: string; avatar: string }, ack: (res: Ack) => void) => void;
}

export interface ServerToClientEvents {
  'game:view': (view: GameView) => void;
  'game:event': (event: TransientEvent) => void;
  'room:closed': (payload: { reason: string }) => void;
}
