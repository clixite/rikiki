import type { EngineErrorCode } from './engine';
import type { GameFormat, GamePace, ScoringVariant } from './rules';
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
  | { type: 'emote'; playerId: string; emote: EmoteId }
  | { type: 'phrase'; playerId: string; phrase: PhraseId }
  | { type: 'paused'; playerId: string; paused: boolean };

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

/**
 * Petites phrases envoyables à la table.
 *
 * Les réactions ne disent pas tout : on veut prévenir qu'on s'absente, féliciter
 * un joli coup, réclamer son tour. D'où une liste de phrases COURTES ET
 * FERMÉES, traduites comme le reste du jeu.
 *
 * Le choix d'une liste fermée plutôt que d'un champ de saisie n'est pas de la
 * paresse : du texte libre ferait de Rikiki une messagerie. Il faudrait alors
 * filtrer, modérer sous 24 h, permettre de bloquer un joueur — tout ce
 * qu'exige la règle 1.2 de l'App Store — pour un jeu qui se joue entre amis
 * qu'on a soi-même invités. Une liste fermée dit l'essentiel sans rien de tout
 * cela, et se traduit dans les vingt-quatre langues sans effort.
 */
export const PHRASES = [
  'nice',       // « Bien joué ! »
  'oops',       // « Aïe… »
  'yourTurn',   // « À toi ! »
  'hurry',      // « On t'attend 🙂 »
  'watchTrump', // « Attention à l'atout »
  'mine',       // « Celui-là est pour moi »
  'sorry',      // « Désolé ! »
  'brb',        // « Je reviens tout de suite »
  'goodGame',   // « Belle partie ! »
  'again',      // « On en refait une ? »
] as const;
export type PhraseId = (typeof PHRASES)[number];

export function isPhraseId(value: unknown): value is PhraseId {
  return typeof value === 'string' && (PHRASES as readonly string[]).includes(value);
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
  /** Choisit le rythme — temps réel ou asynchrone (hôte, lobby uniquement). */
  'room:setPace': (payload: { pace: GamePace }, ack: (res: Ack) => void) => void;
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
  /** Envoie une petite phrase à la table (même limitation de débit). */
  'game:phrase': (payload: { phrase: PhraseId }, ack: (res: Ack) => void) => void;
  /**
   * Se met en pause, ou en sort. En pause, le robot tient le siège : la table
   * n'attend pas, et le joueur retrouve sa place intacte à son retour.
   */
  'game:pause': (payload: { paused: boolean }, ack: (res: Ack) => void) => void;
}

export interface ServerToClientEvents {
  'game:view': (view: GameView) => void;
  'game:event': (event: TransientEvent) => void;
  'room:closed': (payload: { reason: string }) => void;
}
