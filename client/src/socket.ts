import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, GameFormat, ServerToClientEvents } from '@rikiki/shared';
import { useGame } from './store/game';
import { useSession } from './store/session';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;
let socketToken: string | null = null;

export function connectSocket(token: string): TypedSocket {
  if (socket && socketToken === token) return socket;
  socket?.close();

  socketToken = token;
  socket = io({ auth: { token } });

  socket.on('connect', () => useGame.getState().setSocketConnected(true));
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

export async function leaveRoom(): Promise<void> {
  await emitAck('room:leave');
  useSession.getState().setRoomCode(null);
  useGame.getState().reset();
}

export const addBot = () => emitAck<{ playerId: string }>('room:addBot');
export const removeBot = (playerId: string) => emitAck('room:removeBot', { playerId });
export const setFormat = (format: GameFormat) => emitAck('room:setFormat', { format });
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
