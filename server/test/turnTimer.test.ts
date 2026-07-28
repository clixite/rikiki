import { afterEach, describe, expect, it, vi } from 'vitest';
import { Room, TURN_SECONDS } from '../src/rooms/Room';
import type { Server } from 'socket.io';

/**
 * Minuteur du tour.
 *
 * Jusqu'à la v1.2, seul un joueur *déconnecté* passait en jeu automatique : un
 * joueur présent mais distrait bloquait la table sans limite et sans recours.
 * Ces tests fixent le comportement attendu — jouer à sa place au bout du
 * délai, mais une seule fois, et jamais à la place de quelqu'un qui a joué.
 */

/** Serveur Socket.IO minimal : la room n'a besoin que d'émettre dans le vide. */
function fakeIo(): Server {
  return { to: () => ({ emit: () => undefined }) } as unknown as Server;
}

function startedRoom(turnSeconds: number) {
  const room = new Room(
    fakeIo(),
    'TEST',
    { id: 'alice', pseudo: 'Alice', avatar: 'a1' },
    {},
    { botDelayMs: 0, turnSeconds },
  );
  room.apply({ type: 'ADD_PLAYER', player: { id: 'bob', pseudo: 'Bob', avatar: 'a2' } });
  room.apply({ type: 'ADD_PLAYER', player: { id: 'carol', pseudo: 'Carol', avatar: 'a3' } });
  room.apply({ type: 'START_GAME', playerId: 'alice' });
  return room;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('minuteur du tour', () => {
  it('annonce à la place du joueur qui ne répond pas', () => {
    vi.useFakeTimers();
    const room = startedRoom(30);
    const round = room.state.round!;
    const waiting = room.state.players.find((p) => p.seat === round.currentSeat)!;
    expect(round.bids[waiting.id]).toBeNull();

    vi.advanceTimersByTime(30_000);

    expect(room.state.round!.bids[waiting.id]).not.toBeNull();
    room.stop?.();
  });

  it("n'agit pas si le joueur a joué entre-temps", () => {
    vi.useFakeTimers();
    const room = startedRoom(30);
    const waiting = room.state.players.find((p) => p.seat === room.state.round!.currentSeat)!;

    // Le joueur annonce de lui-même bien avant l'échéance
    vi.advanceTimersByTime(5_000);
    room.apply({ type: 'BID', playerId: waiting.id, bid: 0 });
    const bidsAfterHuman = { ...room.state.round!.bids };

    vi.advanceTimersByTime(30_000);

    // Son annonce n'a pas été écrasée par le minuteur
    expect(room.state.round!.bids[waiting.id]).toBe(bidsAfterHuman[waiting.id]);
    room.stop?.();
  });

  it('diffuse une échéance tant que la table attend un humain', () => {
    vi.useFakeTimers();
    const room = startedRoom(30);
    expect(room.turnDeadline).not.toBeNull();
    expect(room.turnDeadline! - Date.now()).toBeGreaterThan(25_000);
    room.stop?.();
  });

  it('se désactive avec un délai nul', () => {
    vi.useFakeTimers();
    const room = startedRoom(0);
    expect(room.turnDeadline).toBeNull();

    const waiting = room.state.players.find((p) => p.seat === room.state.round!.currentSeat)!;
    vi.advanceTimersByTime(10 * 60_000);
    expect(room.state.round!.bids[waiting.id]).toBeNull();
    room.stop?.();
  });

  it('laisse un délai par défaut raisonnable', () => {
    // Trop court, on presse des amis ; trop long, la table reste bloquée.
    expect(TURN_SECONDS).toBeGreaterThanOrEqual(20);
    expect(TURN_SECONDS).toBeLessThanOrEqual(120);
  });
});
