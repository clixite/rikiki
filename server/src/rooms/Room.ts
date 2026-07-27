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
/**
 * Les écritures en base sont groupées : une action déclenche souvent plusieurs
 * changements d'état rapprochés (carte jouée → pli remporté → manche scorée).
 * Un délai court garde la base quasiment à jour sans écrire à chaque micro-pas ;
 * `flush()` force l'écriture aux moments critiques (arrêt du serveur).
 */
const PERSIST_DEBOUNCE_MS = 250;

export interface RoomCallbacks {
  onGameOver?: (state: GameState, bestRounds: Record<string, number>) => void;
  onEmpty?: (room: Room) => void;
  /** Écriture de l'état en base (voir `LiveRoomsRepo`). */
  onPersist?: (room: Room) => void;
}

export interface RoomOptions {
  /** Délai minimal avant l'action d'un bot ; 0 = immédiat (tests). */
  botDelayMs?: number;
  /**
   * Appelée une seule fois par tour, dès qu'un nouveau joueur devient le
   * joueur attendu (phase `bidding` ou `playing`). Sert aux notifications
   * push ; le filtrage (bot, joueur encore connecté) se fait côté appelant.
   */
  onTurn?: (room: Room, playerId: string) => void;
}

export class Room {
  state: GameState;
  readonly sockets = new Map<string, Socket>();
  private graceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private autoPlaySet = new Set<string>();
  private autoplayTimer: ReturnType<typeof setTimeout> | null = null;
  /** Meilleur score de manche par joueur (pour les stats). */
  private bestRounds: Record<string, number> = {};
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  /** Signature du tour déjà signalé, pour ne notifier qu'une fois par tour. */
  private lastTurnKey: string | null = null;
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

  /**
   * Reconstruit une room à partir d'un état persisté (redémarrage du serveur).
   * Renvoie `null` si l'état est inexploitable (aucun joueur).
   */
  static restore(
    io: Server,
    state: GameState,
    callbacks: RoomCallbacks = {},
    options: RoomOptions = {},
    lastActivity = Date.now(),
  ): Room | null {
    const host = state.players.find((p) => p.id === state.hostId) ?? state.players[0];
    if (!host) return null;
    const room = new Room(io, state.code, host, callbacks, options);
    room.state = state;
    room.lastActivity = lastActivity;
    room.resume();
    return room;
  }

  get code(): string {
    return this.state.code;
  }

  /**
   * Reprise après un redémarrage du serveur.
   *
   * Les sockets et les timers vivent dans le processus : rien de tout cela n'a
   * survécu. On repart donc d'une base saine :
   *  - tous les joueurs humains repassent `connected: false` (aucun socket
   *    n'est rattaché) ; ils se reconnectent normalement via `room:join`,
   *    l'identité étant le userId du JWT ;
   *  - une nouvelle période de grâce de `GRACE_SECONDS` est armée pour chacun
   *    d'eux. C'est le pendant exact d'une déconnexion ordinaire : le joueur a
   *    le temps de revenir (le client se reconnecte tout seul), et s'il ne
   *    revient pas la partie n'est pas bloquée pour autant — elle continue en
   *    auto-play, ou le joueur est retiré s'il s'agit d'un lobby ;
   *  - les bots (toujours « connectés ») reprennent la main immédiatement si
   *    c'est leur tour.
   *
   * Note : `bestRounds` n'est pas persisté (statistique annexe) ; après un
   * redémarrage, le meilleur score de manche repart de zéro pour la partie.
   */
  private resume(): void {
    this.state = {
      ...this.state,
      players: this.state.players.map((p) => (isBotId(p.id) ? p : { ...p, connected: false })),
    };
    for (const p of this.state.players) {
      if (isBotId(p.id)) continue;
      const t = setTimeout(() => this.onRestoreGraceExpired(p.id), GRACE_SECONDS * 1000);
      t.unref?.();
      this.graceTimers.set(p.id, t);
    }
    this.schedulePersist();
    this.scheduleAutoplay();
  }

  /** Fin de la période de grâce accordée après un redémarrage. */
  private onRestoreGraceExpired(userId: string): void {
    this.graceTimers.delete(userId);
    if (this.sockets.has(userId)) return;
    // En lobby, une déconnexion retire le joueur (cf. `detach`) — sans quoi la
    // partie pourrait démarrer avec des fantômes qui bloqueraient leur tour.
    if (this.state.phase === 'lobby') {
      this.removePlayer(userId);
      return;
    }
    this.onGraceExpired(userId);
  }

  /** Marque l'état comme modifié ; l'écriture réelle est groupée. */
  private schedulePersist(): void {
    if (!this.callbacks.onPersist) return;
    this.dirty = true;
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.flush();
    }, PERSIST_DEBOUNCE_MS);
    this.persistTimer.unref?.();
  }

  /** Écrit sans attendre l'état en base s'il a changé depuis la dernière écriture. */
  flush(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.callbacks.onPersist?.(this);
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
      this.schedulePersist();
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
    this.signalTurnChange();
  }

  /** Détecte le changement de joueur attendu et prévient l'observateur (push). */
  private signalTurnChange(): void {
    const onTurn = this.options.onTurn;
    if (!onTurn) return;
    const s = this.state;
    const inTurn = (s.phase === 'bidding' || s.phase === 'playing') && s.round !== null;
    if (!inTurn) {
      this.lastTurnKey = null;
      return;
    }
    const r = s.round!;
    const key = `${s.phase}:${r.roundIndex}:${r.currentSeat}:${Object.values(r.tricksWon).reduce((a, b) => a + b, 0)}:${r.currentTrick.plays.length}`;
    if (key === this.lastTurnKey) return;
    this.lastTurnKey = key;
    const playerId = s.players.find((p) => p.seat === r.currentSeat)?.id;
    if (playerId) onTurn(this, playerId);
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
    this.schedulePersist();
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
      this.schedulePersist();
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
    this.schedulePersist();
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
        this.schedulePersist();
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

  private clearTimers(): void {
    for (const t of this.graceTimers.values()) clearTimeout(t);
    this.graceTimers.clear();
    if (this.autoplayTimer) clearTimeout(this.autoplayTimer);
    this.autoplayTimer = null;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = null;
  }

  private releaseSockets(): void {
    for (const socket of this.sockets.values()) {
      socket.data.roomCode = null;
      socket.leave(this.code);
    }
    this.sockets.clear();
  }

  /** Fermeture définitive : les clients sont prévenus, l'état n'est plus utile. */
  close(reason: string): void {
    this.io.to(this.code).emit('room:closed', { reason });
    // La ligne en base est supprimée par le RoomManager : inutile d'écrire.
    this.dirty = false;
    this.clearTimers();
    this.releaseSockets();
  }

  /**
   * Arrêt du serveur : on écrit l'état puis on libère les ressources, sans
   * prévenir les clients — la partie reprendra au prochain démarrage.
   */
  dispose(): void {
    this.flush();
    this.clearTimers();
    this.releaseSockets();
  }
}
