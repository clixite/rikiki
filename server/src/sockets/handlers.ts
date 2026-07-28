import type { Server, Socket } from 'socket.io';
import type { ErrorCode, ProtocolError, PublicUser } from '@rikiki/shared';
import { isBotId, isEmoteId, isGameFormat } from '@rikiki/shared';
import type { Config } from '../config';
import type { UsersRepo } from '../db/users.repo';
import type { GroupsRepo } from '../db/groups.repo';
import { verifyToken } from '../auth/tokens';
import { profileSchema } from '../auth/routes';
import type { RoomManager } from '../rooms/RoomManager';
import { isValidCodeFormat, normalizeCode } from '../rooms/roomCodes';

/** Anti-spam des réactions : au plus 3 par tranche de 5 secondes et par joueur. */
const EMOTE_BURST = 3;
const EMOTE_WINDOW_MS = 5000;

const MESSAGES: Record<ErrorCode, string> = {
  BAD_PHASE: 'Action impossible dans cette phase de jeu.',
  NOT_HOST: "Seul l'hôte peut faire ça.",
  NOT_ENOUGH_PLAYERS: 'Il faut au moins 3 joueurs pour commencer.',
  ROOM_FULL: 'La partie est complète (8 joueurs max).',
  PLAYER_NOT_FOUND: 'Joueur introuvable.',
  NOT_YOUR_TURN: "Ce n'est pas ton tour.",
  ILLEGAL_BID: 'Annonce invalide.',
  ILLEGAL_BID_HOOK: 'Annonce interdite par la règle du crochet.',
  ILLEGAL_CARD: 'Tu ne peux pas jouer cette carte.',
  ILLEGAL_FORMAT: 'Format de partie inconnu.',
  ROOM_NOT_FOUND: 'Aucune partie avec ce code.',
  GAME_ALREADY_STARTED: 'La partie a déjà commencé.',
  ALREADY_IN_ROOM: 'Tu es déjà dans une partie.',
  NOT_IN_ROOM: "Tu n'es dans aucune partie.",
  INVALID_TOKEN: 'Session invalide, reconnecte-toi.',
  INVALID_PAYLOAD: 'Requête invalide.',
};

function protoErr(code: ErrorCode): { ok: false; error: ProtocolError } {
  return { ok: false, error: { code, message: MESSAGES[code] } };
}

type Ack = (res: unknown) => void;

export function registerSocketHandlers(
  io: Server,
  rooms: RoomManager,
  users: UsersRepo,
  config: Config,
  groups?: GroupsRepo,
): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const userId = token ? verifyToken(token, config.JWT_SECRET) : null;
    const user = userId ? users.getById(userId) : null;
    if (!user) return next(new Error('INVALID_TOKEN'));
    socket.data.user = user;
    socket.data.roomCode = null;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as PublicUser;

    const currentRoom = () => {
      const code = socket.data.roomCode as string | null;
      return code ? (rooms.get(code) ?? null) : null;
    };

    const leaveCurrent = () => {
      const room = currentRoom();
      if (room) room.detach(user.id, socket);
    };

    /** Fenêtre glissante de limitation des réactions, propre à ce joueur. */
    const emoteTimes: number[] = [];
    const allowEmote = () => {
      const now = Date.now();
      while (emoteTimes.length > 0 && now - emoteTimes[0] > EMOTE_WINDOW_MS) emoteTimes.shift();
      if (emoteTimes.length >= EMOTE_BURST) return false;
      emoteTimes.push(now);
      return true;
    };

    /** Quitte la room courante seulement si ce n'est pas celle visée. */
    const leaveIfOther = (targetCode: string) => {
      const room = currentRoom();
      if (room && room.code !== targetCode) room.detach(user.id, socket);
    };

    socket.on('room:create', (ack: Ack) => {
      if (typeof ack !== 'function') return;
      leaveCurrent();
      const fresh = users.getById(user.id) ?? user;
      const room = rooms.create({ id: fresh.id, pseudo: fresh.pseudo, avatar: fresh.avatar });
      room.attach(user.id, socket);
      ack({ ok: true, code: room.code });
    });

    socket.on('room:join', (payload: { code?: string } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const code = normalizeCode(String(payload?.code ?? ''));
      if (!isValidCodeFormat(code)) return ack(protoErr('INVALID_PAYLOAD'));
      const room = rooms.get(code);
      if (!room) return ack(protoErr('ROOM_NOT_FOUND'));

      if (room.isMember(user.id)) {
        // Reconnexion (ou déjà dans la room depuis un autre onglet)
        leaveIfOther(code);
        const inGame = room.state.phase !== 'lobby';
        room.attach(user.id, socket);
        if (inGame) room.emitEvent({ type: 'player-reconnected', playerId: user.id });
        return ack({ ok: true, code });
      }

      if (room.state.phase !== 'lobby') return ack(protoErr('GAME_ALREADY_STARTED'));
      leaveIfOther(code);
      const fresh = users.getById(user.id) ?? user;
      const res = room.apply({ type: 'ADD_PLAYER', player: { id: fresh.id, pseudo: fresh.pseudo, avatar: fresh.avatar } });
      if (!res.ok) return ack(protoErr(res.error));
      room.attach(user.id, socket);
      room.emitEvent({ type: 'player-joined', playerId: fresh.id, pseudo: fresh.pseudo });
      ack({ ok: true, code });
    });

    socket.on('room:leave', (ack: Ack) => {
      if (typeof ack !== 'function') return;
      leaveCurrent();
      ack({ ok: true });
    });

    socket.on('room:kick', (payload: { playerId?: string } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      if (room.state.hostId !== user.id) return ack(protoErr('NOT_HOST'));
      if (room.state.phase !== 'lobby') return ack(protoErr('BAD_PHASE'));
      const targetId = String(payload?.playerId ?? '');
      if (!room.isMember(targetId) || targetId === user.id) return ack(protoErr('PLAYER_NOT_FOUND'));
      room.kick(targetId);
      ack({ ok: true });
    });

    socket.on('room:addBot', (ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      if (room.state.hostId !== user.id) return ack(protoErr('NOT_HOST'));
      if (room.state.phase !== 'lobby') return ack(protoErr('BAD_PHASE'));
      const res = room.addBot();
      ack(res.ok ? { ok: true, playerId: res.player.id } : protoErr(res.error));
    });

    socket.on('room:removeBot', (payload: { playerId?: string } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      if (room.state.hostId !== user.id) return ack(protoErr('NOT_HOST'));
      if (room.state.phase !== 'lobby') return ack(protoErr('BAD_PHASE'));
      const targetId = String(payload?.playerId ?? '');
      if (!isBotId(targetId) || !room.isMember(targetId)) return ack(protoErr('PLAYER_NOT_FOUND'));
      room.kick(targetId);
      ack({ ok: true });
    });

    socket.on('room:setFormat', (payload: { format?: unknown } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      if (!isGameFormat(payload?.format)) return ack(protoErr('INVALID_PAYLOAD'));
      // Le moteur revérifie l'hôte et la phase ; l'application diffuse la vue à tout le salon.
      const res = room.apply({ type: 'SET_FORMAT', playerId: user.id, format: payload.format });
      ack(res.ok ? { ok: true } : protoErr(res.error));
    });

    /**
     * Rattache la partie à un groupe d'amis : à la fin, les résultats
     * alimenteront son classement cumulé. Réservé à l'hôte, en lobby, et
     * uniquement pour un groupe dont il est membre. `null` détache la partie.
     */
    socket.on('room:setGroup', (payload: { groupId?: unknown } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      if (room.state.hostId !== user.id) return ack(protoErr('NOT_HOST'));
      if (room.state.phase !== 'lobby') return ack(protoErr('BAD_PHASE'));

      const raw = payload?.groupId;
      const groupId = raw === null || raw === undefined || raw === '' ? null : String(raw);
      if (groupId !== null && !groups?.isMember(groupId, user.id)) return ack(protoErr('INVALID_PAYLOAD'));

      room.state = { ...room.state, groupId };
      room.broadcastViews();
      ack({ ok: true });
    });

    socket.on('room:rematch', (ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      if (room.state.hostId !== user.id) return ack(protoErr('NOT_HOST'));
      if (room.state.phase !== 'game-over') return ack(protoErr('BAD_PHASE'));
      const fresh = users.getById(user.id) ?? user;
      const next = rooms.create({ id: fresh.id, pseudo: fresh.pseudo, avatar: fresh.avatar });
      room.emitEvent({ type: 'rematch', code: next.code });
      ack({ ok: true, code: next.code });
    });

    socket.on('game:start', (ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      const res = room.apply({ type: 'START_GAME', playerId: user.id });
      ack(res.ok ? { ok: true } : protoErr(res.error));
    });

    socket.on('game:bid', (payload: { bid?: number } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      const bid = Number(payload?.bid);
      const res = room.apply({ type: 'BID', playerId: user.id, bid });
      if (res.ok) room.emitEvent({ type: 'bid-placed', playerId: user.id, bid });
      ack(res.ok ? { ok: true } : protoErr(res.error));
    });

    socket.on('game:playCard', (payload: { cardId?: string } | undefined, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      const cardId = String(payload?.cardId ?? '');
      const res = room.apply({ type: 'PLAY_CARD', playerId: user.id, cardId });
      if (res.ok) {
        room.emitEvent({ type: 'card-played', playerId: user.id, cardId });
        const round = room.state.round;
        const trickJustEnded =
          round?.lastTrick && (round.currentTrick.plays.length === 0 || room.state.phase === 'round-scoring');
        if (trickJustEnded) room.emitEvent({ type: 'trick-won', playerId: round!.lastTrick!.winnerId });
        if (room.state.phase === 'round-scoring') room.emitEvent({ type: 'round-scored' });
      }
      ack(res.ok ? { ok: true } : protoErr(res.error));
    });

    socket.on('game:nextRound', (ack: Ack) => {
      if (typeof ack !== 'function') return;
      const room = currentRoom();
      if (!room) return ack(protoErr('NOT_IN_ROOM'));
      const res = room.apply({ type: 'NEXT_ROUND', playerId: user.id });
      ack(res.ok ? { ok: true } : protoErr(res.error));
    });

    socket.on('profile:update', (payload: unknown, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const parsed = profileSchema.safeParse(payload);
      if (!parsed.success) return ack(protoErr('INVALID_PAYLOAD'));
      users.updateProfile(user.id, parsed.data.pseudo, parsed.data.avatar);
      const room = currentRoom();
      if (room) {
        room.apply({ type: 'UPDATE_PROFILE', playerId: user.id, pseudo: parsed.data.pseudo, avatar: parsed.data.avatar });
      }
      ack({ ok: true });
    });

    /**
     * Réactions à la table.
     *
     * Le débit est bridé par joueur : sans cela, un doigt appuyé en boucle
     * transforme la table en mitraillette d'émojis et gâche la partie pour
     * tout le monde. Trois par fenêtre de cinq secondes suffisent largement
     * pour chambrer.
     */
    socket.on('game:emote', (payload: unknown, ack: Ack) => {
      if (typeof ack !== 'function') return;
      const emote = (payload as { emote?: unknown } | null)?.emote;
      if (!isEmoteId(emote)) return ack(protoErr('INVALID_PAYLOAD'));
      const room = currentRoom();
      if (!room) return ack(protoErr('PLAYER_NOT_FOUND'));
      if (!allowEmote()) return ack({ ok: true });
      room.emitEvent({ type: 'emote', playerId: user.id, emote });
      ack({ ok: true });
    });

    socket.on('disconnect', () => {
      leaveCurrent();
    });
  });
}
