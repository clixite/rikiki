import type { Server } from 'socket.io';
import { DEFAULT_PACE, type ActiveGame, type GameState, type Player } from '@rikiki/shared';
import type { LiveRoomsRepo } from '../db/rooms.repo';
import { Room, type RoomCallbacks, type RoomOptions } from './Room';
import { randomCode } from './roomCodes';

const LOBBY_TTL_MS = 30 * 60_000;
const ABANDONED_TTL_MS = 10 * 60_000;
const GAME_OVER_TTL_MS = 15 * 60_000;
/**
 * Durée de vie d'une partie asynchrone.
 *
 * Une table vide n'y est pas un abandon mais l'état normal : on ne peut donc
 * pas la balayer au bout de dix minutes. Deux semaines laissent le temps d'un
 * tour de vacances sans garder indéfiniment des parties que plus personne
 * n'ouvrira.
 */
const ASYNC_TTL_MS = 14 * 24 * 3_600_000;

/** Plus longue rétention possible : au-delà, plus rien n'est restaurable. */
const MAX_TTL_MS = Math.max(LOBBY_TTL_MS, GAME_OVER_TTL_MS, ASYNC_TTL_MS);

/**
 * Durée au-delà de laquelle une partie persistée n'est plus restaurée.
 * On réutilise les TTL du `sweep()` : une room restaurée n'a par construction
 * aucun socket connecté, c'est donc le délai d'abandon (10 min) qui s'applique
 * aux parties en cours — sauf en asynchrone, où l'absence est la règle.
 */
function restoreTtl(state: GameState): number {
  if (state.phase === 'game-over') return GAME_OVER_TTL_MS;
  if (state.pace === 'async') return ASYNC_TTL_MS;
  if (state.phase === 'lobby') return LOBBY_TTL_MS;
  return ABANDONED_TTL_MS;
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private sweepInterval: ReturnType<typeof setInterval>;

  constructor(
    private io: Server,
    private onGameOver?: RoomCallbacks['onGameOver'],
    private roomOptions: RoomOptions = {},
    private live?: LiveRoomsRepo,
  ) {
    this.restore();
    this.sweepInterval = setInterval(() => this.sweep(), 60_000);
    this.sweepInterval.unref?.();
  }

  private roomCallbacks(): RoomCallbacks {
    return {
      onGameOver: this.onGameOver,
      onEmpty: (r) => this.remove(r.code, 'empty'),
      onPersist: (r) => this.live?.save(r.code, r.state),
    };
  }

  create(host: Pick<Player, 'id' | 'pseudo' | 'avatar'> & { photo?: string | null }): Room {
    let code = randomCode();
    while (this.rooms.has(code)) code = randomCode();
    const room = new Room(this.io, code, host, this.roomCallbacks(), this.roomOptions);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  remove(code: string, reason: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    this.rooms.delete(code);
    room.close(reason);
    this.live?.delete(code);
  }

  /**
   * Recharge au démarrage les parties écrites en base par l'instance
   * précédente du serveur. Les parties trop vieilles sont écartées et purgées.
   */
  private restore(now = Date.now()): void {
    if (!this.live) return;
    // Purge de masse : au-delà du plus grand TTL, plus rien n'est restaurable.
    this.live.deleteOlderThan(now - MAX_TTL_MS);
    for (const row of this.live.loadAll()) {
      if (now - row.updatedAt > restoreTtl(row.state)) {
        this.live.delete(row.code);
        continue;
      }
      const room = Room.restore(this.io, row.state, this.roomCallbacks(), this.roomOptions, row.updatedAt);
      if (!room) {
        this.live.delete(row.code);
        continue;
      }
      this.rooms.set(room.code, room);
    }
  }

  /**
   * Parties en cours auxquelles ce joueur participe.
   *
   * Celles qui l'attendent viennent en premier : c'est la seule question que
   * se pose quelqu'un qui ouvre l'application avec cinq parties en cours.
   */
  gamesOf(userId: string): ActiveGame[] {
    const out: ActiveGame[] = [];
    for (const room of this.rooms.values()) {
      const s = room.state;
      if (s.phase === 'game-over' || !s.players.some((p) => p.id === userId)) continue;
      const awaited =
        (s.phase === 'bidding' || s.phase === 'playing') && s.round
          ? (s.players.find((p) => p.seat === s.round!.currentSeat) ?? null)
          : s.phase === 'round-scoring'
            ? (s.players.find((p) => p.id === s.hostId) ?? null)
            : null;
      out.push({
        code: s.code,
        phase: s.phase,
        pace: s.pace ?? DEFAULT_PACE,
        playersCount: s.players.length,
        myTurn: awaited?.id === userId,
        waitingFor: awaited?.pseudo ?? null,
        round: (s.round?.roundIndex ?? 0) + 1,
        roundsTotal: s.roundsSequence.length,
        myScore: s.players.find((p) => p.id === userId)?.totalScore ?? 0,
        updatedAt: room.lastActivity,
      });
    }
    return out.sort((a, b) => Number(b.myTurn) - Number(a.myTurn) || b.updatedAt - a.updatedAt);
  }

  /** Écrit sans attendre les états en attente d'enregistrement. */
  flushAll(): void {
    for (const room of this.rooms.values()) room.flush();
  }

  sweep(now = Date.now()): void {
    for (const [code, room] of this.rooms) {
      const idle = now - room.lastActivity;
      // Une partie asynchrone désertée n'est pas abandonnée : on ne la balaie
      // que si plus personne n'y a touché depuis très longtemps.
      const expired =
        room.state.phase === 'game-over'
          ? idle > GAME_OVER_TTL_MS
          : room.isAsync
            ? idle > ASYNC_TTL_MS
            : (room.state.phase === 'lobby' && idle > LOBBY_TTL_MS) ||
              (room.connectedCount() === 0 && idle > ABANDONED_TTL_MS);
      if (expired) this.remove(code, 'expired');
    }
  }

  /**
   * Arrêt du serveur : les états sont écrits en base et les rooms libérées,
   * mais les lignes sont conservées et les clients ne reçoivent pas de
   * `room:closed` — les parties reprennent au redémarrage.
   */
  stop(): void {
    clearInterval(this.sweepInterval);
    for (const room of this.rooms.values()) room.dispose();
    this.rooms.clear();
  }
}
