import crypto from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import {
  applyAction,
  createGame,
  lowestLegalBid,
  lowestLegalCard,
  type EngineResult,
  type GameAction,
  type GameState,
  type Player,
  type TransientEvent,
} from '@rikiki/shared';
import { projectView } from '../sockets/views';

export const GRACE_SECONDS = 90;
const AUTOPLAY_DELAY_MS = 800;

export interface RoomCallbacks {
  onGameOver?: (state: GameState, bestRounds: Record<string, number>) => void;
  onEmpty?: (room: Room) => void;
}

export class Room {
  state: GameState;
  readonly sockets = new Map<string, Socket>();
  private graceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private autoPlaySet = new Set<string>();
  private autoplayTimer: ReturnType<typeof setTimeout> | null = null;
  /** Meilleur score de manche par joueur (pour les stats). */
  private bestRounds: Record<string, number> = {};
  lastActivity = Date.now();

  constructor(
    private io: Server,
    code: string,
    host: Pick<Player, 'id' | 'pseudo' | 'avatar'>,
    private callbacks: RoomCallbacks = {},
  ) {
    this.state = createGame(code, crypto.randomUUID(), Date.now(), host);
  }

  get code(): string {
    return this.state.code;
  }

  apply(action: GameAction): EngineResult {
    const res = applyAction(this.state, action);
    if (res.ok) {
      const prevPhase = this.state.phase;
      this.state = res.state;
      this.lastActivity = Date.now();
      if (this.state.phase === 'round-scoring' && prevPhase !== 'round-scoring' && this.state.round?.roundScores) {
        for (const [pid, score] of Object.entries(this.state.round.roundScores)) {
          this.bestRounds[pid] = Math.max(this.bestRounds[pid] ?? 0, score);
        }
      }
      this.broadcastViews();
      if (this.state.phase === 'game-over' && prevPhase !== 'game-over') {
        this.callbacks.onGameOver?.(this.state, this.bestRounds);
      }
      this.scheduleAutoplay();
    }
    return res;
  }

  emitEvent(event: TransientEvent): void {
    this.io.to(this.code).emit('game:event', event);
  }

  broadcastViews(): void {
    for (const [userId, socket] of this.sockets) {
      socket.emit('game:view', projectView(this.state, userId));
    }
  }

  isMember(userId: string): boolean {
    return this.state.players.some((p) => p.id === userId);
  }

  /** Attache (ou ré-attache) le socket d'un joueur et le déclare connecté. */
  attach(userId: string, socket: Socket): void {
    const prev = this.sockets.get(userId);
    if (prev && prev.id !== socket.id) {
      prev.data.roomCode = null;
      prev.leave(this.code);
    }
    this.sockets.set(userId, socket);
    socket.join(this.code);
    socket.data.roomCode = this.code;

    const timer = this.graceTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(userId);
    }
    this.autoPlaySet.delete(userId);

    const res = applyAction(this.state, { type: 'SET_CONNECTED', playerId: userId, connected: true });
    if (res.ok) this.state = res.state;
    this.lastActivity = Date.now();
    this.broadcastViews();
  }

  /** Déconnexion (volontaire ou non) : retrait en lobby, période de grâce en partie. */
  detach(userId: string, socket: Socket): void {
    if (this.sockets.get(userId)?.id !== socket.id) return;
    this.sockets.delete(userId);
    socket.data.roomCode = null;
    socket.leave(this.code);

    if (this.state.phase === 'lobby') {
      this.removePlayer(userId);
      return;
    }
    const res = applyAction(this.state, { type: 'SET_CONNECTED', playerId: userId, connected: false });
    if (res.ok) {
      this.state = res.state;
      this.broadcastViews();
    }
    this.emitEvent({ type: 'player-disconnected', playerId: userId, graceSeconds: GRACE_SECONDS });
    const t = setTimeout(() => this.onGraceExpired(userId), GRACE_SECONDS * 1000);
    this.graceTimers.set(userId, t);
  }

  removePlayer(userId: string): void {
    const pseudo = this.state.players.find((p) => p.id === userId)?.pseudo ?? '';
    const prevHost = this.state.hostId;
    const res = applyAction(this.state, { type: 'REMOVE_PLAYER', playerId: userId });
    if (!res.ok) return;
    this.state = res.state;
    this.lastActivity = Date.now();
    this.emitEvent({ type: 'player-left', playerId: userId, pseudo });
    if (this.state.hostId !== prevHost) {
      this.emitEvent({ type: 'host-changed', hostId: this.state.hostId });
    }
    this.broadcastViews();
    if (this.state.players.length === 0) this.callbacks.onEmpty?.(this);
  }

  kick(userId: string): void {
    const socket = this.sockets.get(userId);
    if (socket) {
      socket.emit('room:closed', { reason: 'kicked' });
      socket.data.roomCode = null;
      socket.leave(this.code);
      this.sockets.delete(userId);
    }
    this.removePlayer(userId);
  }

  private onGraceExpired(userId: string): void {
    this.graceTimers.delete(userId);
    this.autoPlaySet.add(userId);
    if (this.state.hostId === userId) {
      const connected = this.state.players.find((p) => p.connected);
      if (connected) {
        this.state = { ...this.state, hostId: connected.id };
        this.emitEvent({ type: 'host-changed', hostId: connected.id });
        this.broadcastViews();
      }
    }
    this.scheduleAutoplay();
  }

  /** Joue automatiquement pour les joueurs absents (plus petite option légale). */
  private scheduleAutoplay(): void {
    if (this.autoplayTimer) return;
    if (!this.nextAutoAction()) return;
    this.autoplayTimer = setTimeout(() => {
      this.autoplayTimer = null;
      const next = this.nextAutoAction();
      if (!next) return;
      const res = this.apply(next.action);
      if (res.ok && next.event) this.emitEvent(next.event);
    }, AUTOPLAY_DELAY_MS);
  }

  private nextAutoAction(): { action: GameAction; event?: TransientEvent } | null {
    const s = this.state;
    if (!s.round) return null;
    if (s.phase === 'bidding' || s.phase === 'playing') {
      const current = s.players.find((p) => p.seat === s.round!.currentSeat);
      if (!current || !this.autoPlaySet.has(current.id)) return null;
      if (s.phase === 'bidding') {
        const bid = lowestLegalBid(s, current.id);
        return {
          action: { type: 'BID', playerId: current.id, bid },
          event: { type: 'bid-placed', playerId: current.id, bid },
        };
      }
      const cid = lowestLegalCard(s, current.id);
      return {
        action: { type: 'PLAY_CARD', playerId: current.id, cardId: cid },
        event: { type: 'card-played', playerId: current.id, cardId: cid },
      };
    }
    if (s.phase === 'round-scoring' && this.autoPlaySet.has(s.hostId)) {
      return { action: { type: 'NEXT_ROUND', playerId: s.hostId } };
    }
    return null;
  }

  connectedCount(): number {
    return this.sockets.size;
  }

  close(reason: string): void {
    this.io.to(this.code).emit('room:closed', { reason });
    for (const t of this.graceTimers.values()) clearTimeout(t);
    this.graceTimers.clear();
    if (this.autoplayTimer) clearTimeout(this.autoplayTimer);
    this.autoplayTimer = null;
    for (const socket of this.sockets.values()) {
      socket.data.roomCode = null;
      socket.leave(this.code);
    }
    this.sockets.clear();
  }
}
