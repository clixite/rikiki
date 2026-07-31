import { io, type Socket } from 'socket.io-client';
import type {
  EmoteId,
  Ack,
  ClientToServerEvents,
  GameFormat,
  GamePace,
  PhraseId,
  ScoringVariant,
  ServerToClientEvents,
} from '@rikiki/shared';
import { useGame } from './store/game';
import { useSession } from './store/session';
import { API_BASE } from './config';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;
let socketToken: string | null = null;

export function connectSocket(token: string): TypedSocket {
  if (socket && socketToken === token) return socket;
  socket?.close();

  socketToken = token;
  socket = API_BASE ? io(API_BASE, { auth: { token } }) : io({ auth: { token } });

  /**
   * Reconnexion.
   *
   * Socket.IO rétablit tout seul la connexion, mais avec un socket NEUF : côté
   * serveur, le joueur reste détaché de sa partie. Il ne recevait donc plus
   * aucune vue et se retrouvait spectateur de sa propre table — le « je me fais
   * déconnecter et je ne peux plus revenir » constaté en partie réelle. Sur
   * mobile, la moindre mise en veille suffit à déclencher ce cas.
   *
   * On réintègre donc la partie à chaque connexion, y compris la première : le
   * serveur reconnaît le joueur à son identifiant et lui rend son siège.
   */
  socket.on('connect', () => {
    useGame.getState().setSocketConnected(true);
    const code = useSession.getState().roomCode;
    if (code) void rejoinRoom(code);
  });
  socket.on('disconnect', () => useGame.getState().setSocketConnected(false));
  socket.on('game:view', (view) => useGame.getState().setView(view));
  socket.on('game:event', (event) => {
    useGame.getState().onEvent(event);
    if (event.type === 'rematch') {
      // L'hôte relance : tout le monde bascule sur la nouvelle partie
      joinRoom(event.code).catch(() => undefined);
    }
  });
  socket.on('room:closed', ({ reason }) => {
    useGame.getState().setClosed(reason);
    useSession.getState().setRoomCode(null);
  });

  return socket;
}

/**
 * Reprend sa place dans une partie après une reconnexion.
 *
 * Discret par nature : ni écran de chargement, ni message. La seule issue qui
 * mérite d'être signalée est la disparition de la partie — et encore, on ne
 * l'efface qu'à ce moment-là, jamais sur un simple aléa réseau.
 */
async function rejoinRoom(code: string): Promise<void> {
  const res = await emitAck<{ code: string }>('room:join', { code });
  if (res.ok) return;
  if (res.error.code === 'ROOM_NOT_FOUND') {
    useSession.getState().setRoomCode(null);
    useGame.getState().setClosed('expired');
  }
}

export function getSocket(): TypedSocket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.close();
  socket = null;
  socketToken = null;
}

function emitAck<T extends Record<string, unknown> = Record<string, never>>(
  event: string,
  payload?: unknown,
): Promise<Ack<T>> {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ ok: false, error: { code: 'INVALID_TOKEN', message: 'Non connecté.' } });
      return;
    }
    const timer = setTimeout(
      () => resolve({ ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Le serveur ne répond pas.' } }),
      5000,
    );
    const cb = (res: Ack<T>) => {
      clearTimeout(timer);
      resolve(res);
    };
    if (payload === undefined) {
      (socket as Socket).emit(event, cb);
    } else {
      (socket as Socket).emit(event, payload, cb);
    }
  });
}

export async function createRoom(): Promise<Ack<{ code: string }>> {
  const res = await emitAck<{ code: string }>('room:create');
  if (res.ok) useSession.getState().setRoomCode(res.code);
  return res;
}

export async function joinRoom(code: string): Promise<Ack<{ code: string }>> {
  const res = await emitAck<{ code: string }>('room:join', { code });
  if (res.ok) useSession.getState().setRoomCode(res.code);
  return res;
}

/** Envoie une réaction à la table. Le serveur bride le débit, on ignore l'échec. */
export function sendEmote(emote: EmoteId): void {
  socket?.emit('game:emote', { emote }, () => undefined);
}

/** Envoie une petite phrase — même principe, même limitation de débit. */
export function sendPhrase(phrase: PhraseId): void {
  socket?.emit('game:phrase', { phrase }, () => undefined);
}

/** Se met en pause, ou en sort : le robot tient le siège pendant ce temps. */
export const setPaused = (paused: boolean) => emitAck('game:pause', { paused });

export async function leaveRoom(): Promise<void> {
  await emitAck('room:leave');
  useSession.getState().setRoomCode(null);
  useGame.getState().reset();
}

export const addBot = () => emitAck<{ playerId: string }>('room:addBot');
export const removeBot = (playerId: string) => emitAck('room:removeBot', { playerId });
export const setFormat = (format: GameFormat) => emitAck('room:setFormat', { format });
export const setScoring = (scoring: ScoringVariant) => emitAck('room:setScoring', { scoring });
export const setPace = (pace: GamePace) => emitAck('room:setPace', { pace });
/** Rattache la partie en cours à un groupe (hôte, lobby) ; `null` la détache. */
export const setRoomGroup = (groupId: string | null) => emitAck('room:setGroup', { groupId });
export const startGame = () => emitAck('game:start');
export const placeBid = (bid: number) => emitAck('game:bid', { bid });
export const playCard = (cardId: string) => emitAck('game:playCard', { cardId });
export const nextRound = () => emitAck('game:nextRound');
export const rematch = () => emitAck<{ code: string }>('room:rematch');
export const kickPlayer = (playerId: string) => emitAck('room:kick', { playerId });
export const updateProfileOnSocket = (pseudo: string, avatar: string) =>
  emitAck('profile:update', { pseudo, avatar });
