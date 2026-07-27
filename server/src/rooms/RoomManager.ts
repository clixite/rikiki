import type { Server } from 'socket.io';
import type { Player } from '@rikiki/shared';
import { Room, type RoomCallbacks, type RoomOptions } from './Room';
import { randomCode } from './roomCodes';

const LOBBY_TTL_MS = 30 * 60_000;
const ABANDONED_TTL_MS = 10 * 60_000;
const GAME_OVER_TTL_MS = 15 * 60_000;

export class RoomManager {
  private rooms = new Map<string, Room>();
  private sweepInterval: ReturnType<typeof setInterval>;

  constructor(
    private io: Server,
    private onGameOver?: RoomCallbacks['onGameOver'],
    private roomOptions: RoomOptions = {},
  ) {
    this.sweepInterval = setInterval(() => this.sweep(), 60_000);
    this.sweepInterval.unref?.();
  }

  create(host: Pick<Player, 'id' | 'pseudo' | 'avatar'>): Room {
    let code = randomCode();
    while (this.rooms.has(code)) code = randomCode();
    const room = new Room(
      this.io,
      code,
      host,
      {
        onGameOver: this.onGameOver,
        onEmpty: (r) => this.remove(r.code, 'empty'),
      },
      this.roomOptions,
    );
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
  }

  sweep(now = Date.now()): void {
    for (const [code, room] of this.rooms) {
      const idle = now - room.lastActivity;
      const expired =
        (room.state.phase === 'lobby' && idle > LOBBY_TTL_MS) ||
        (room.state.phase === 'game-over' && idle > GAME_OVER_TTL_MS) ||
        (room.connectedCount() === 0 && idle > ABANDONED_TTL_MS);
      if (expired) this.remove(code, 'expired');
    }
  }

  stop(): void {
    clearInterval(this.sweepInterval);
    for (const code of [...this.rooms.keys()]) this.remove(code, 'shutdown');
  }
}
