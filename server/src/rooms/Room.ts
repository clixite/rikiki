import crypto from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import {
  applyAction,
  botBid,
  botCard,
  createGame,
  hashSeed,
  isBotId,
  lowestLegalBid,
  lowestLegalCard,
  mulberry32,
  nextBotProfile,
  type BotProfile,
  type EngineErrorCode,
  type EngineResult,
  type GameAction,
  type GameState,
  type Player,
  type TransientEvent,
} from '@rikiki/shared';
import { projectView } from '../sockets/views';

export const GRACE_SECONDS = 90;
const AUTOPLAY_DELAY_MS = 800;
/** Délai « humain » avant qu'un bot ne joue (base + jitter déterministe). */
export const DEFAULT_BOT_DELAY_MS = 800;
const BOT_DELAY_SPREAD_MS = 700;

export interface RoomCallbacks {
  onGameOver?: (state: GameState, bestRounds: Record<string, number>) => void;
  onEmpty?: (room: Room) => void;
}

export interface RoomOptions {
  /** Délai minimal avant l'action d'un bot ; 0 = immédiat (tests). */
  botDelayMs?: number;
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
    private options: RoomOptions = {},
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
    // Une room vide — ou qui ne contiendrait plus que des bots — se ferme.
    if (this.state.players.every((p) => isBotId(p.id))) this.callbacks.onEmpty?.(this);
  }

  /** Ajoute un joueur automatique au lobby. */
  addBot(): { ok: true; player: BotProfile } | { ok: false; error: EngineErrorCode } {
    const profile = nextBotProfile(this.state.players.map((p) => p.id));
    const res = this.apply({ type: 'ADD_PLAYER', player: profile });
    if (!res.ok) return { ok: false, error: res.error };
    this.emitEvent({ type: 'player-joined', playerId: profile.id, pseudo: profile.pseudo });
    return { ok: true, player: profile };
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
      // Un bot ne devient jamais hôte : si personne d'autre n'est là, l'hôte
      // reste en place et ses actions sont jouées automatiquement.
      const connected = this.state.players.find((p) => p.connected && !isBotId(p.id));
      if (connected) {
        this.state = { ...this.state, hostId: connected.id };
        this.emitEvent({ type: 'host-changed', hostId: connected.id });
        this.broadcastViews();
      }
    }
    this.scheduleAutoplay();
  }

  /**
   * Joue automatiquement : stratégie de bot pour les joueurs automatiques,
   * plus petite option légale pour les humains absents.
   */
  private scheduleAutoplay(): void {
    if (this.autoplayTimer) return;
    const pending = this.nextAutoAction();
    if (!pending) return;
    this.autoplayTimer = setTimeout(
      () => {
        this.autoplayTimer = null;
        const next = this.nextAutoAction();
        if (!next) return;
        const res = this.apply(next.action);
        if (!res.ok) return;
        if (next.event) this.emitEvent(next.event);
        if (next.action.type === 'PLAY_CARD') this.emitPlayFollowUps();
      },
      pending.isBot ? this.botDelay() : AUTOPLAY_DELAY_MS,
    );
  }

  /** Délai réaliste et déterministe (dérivé du seed) avant l'action d'un bot. */
  private botDelay(): number {
    const base = this.options.botDelayMs ?? DEFAULT_BOT_DELAY_MS;
    if (base <= 0) return 0;
    const r = this.state.round;
    const key = `${this.state.seed}:bot:${r?.roundIndex ?? 0}:${r?.currentSeat ?? 0}:${r?.currentTrick.plays.length ?? 0}`;
    return base + Math.floor(mulberry32(hashSeed(key))() * BOT_DELAY_SPREAD_MS);
  }

  /** Événements d'animation qui suivent une carte jouée (pli remporté, manche scorée). */
  private emitPlayFollowUps(): void {
    const round = this.state.round;
    if (!round?.lastTrick) return;
    const trickJustEnded = round.currentTrick.plays.length === 0 || this.state.phase === 'round-scoring';
    if (trickJustEnded) this.emitEvent({ type: 'trick-won', playerId: round.lastTrick.winnerId });
    if (this.state.phase === 'round-scoring') this.emitEvent({ type: 'round-scored' });
  }

  private nextAutoAction(): { action: GameAction; event?: TransientEvent; isBot: boolean } | null {
    const s = this.state;
    if (!s.round) return null;
    if (s.phase === 'bidding' || s.phase === 'playing') {
      const current = s.players.find((p) => p.seat === s.round!.currentSeat);
      if (!current) return null;
      const isBot = isBotId(current.id);
      if (!isBot && !this.autoPlaySet.has(current.id)) return null;
      if (s.phase === 'bidding') {
        const bid = isBot ? botBid(s, current.id) : lowestLegalBid(s, current.id);
        return {
          action: { type: 'BID', playerId: current.id, bid },
          event: { type: 'bid-placed', playerId: current.id, bid },
          isBot,
        };
      }
      const cid = isBot ? botCard(s, current.id) : lowestLegalCard(s, current.id);
      return {
        action: { type: 'PLAY_CARD', playerId: current.id, cardId: cid },
        event: { type: 'card-played', playerId: current.id, cardId: cid },
        isBot,
      };
    }
    // Manche suivante : seulement si l'hôte est absent (ou, cas limite, un bot).
    if (s.phase === 'round-scoring' && (this.autoPlaySet.has(s.hostId) || isBotId(s.hostId))) {
      return { action: { type: 'NEXT_ROUND', playerId: s.hostId }, isBot: isBotId(s.hostId) };
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
