import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server, Socket } from 'socket.io';
import { GRACE_SECONDS, Room } from '../src/rooms/Room';
import { RoomManager } from '../src/rooms/RoomManager';

/**
 * Parties asynchrones.
 *
 * Tout ce qui, en temps réel, sert à ne pas faire attendre la table devient
 * nuisible quand chacun joue à son rythme : le minuteur du tour presse un
 * joueur qui n'est pas là, le jeu automatique lui vole sa partie, et le
 * balayage ferme une table dont l'absence est justement l'état normal. Ces
 * tests fixent le fait qu'aucun de ces trois mécanismes ne s'y applique.
 */

function fakeIo(): Server {
  return { to: () => ({ emit: () => undefined }) } as unknown as Server;
}

/** Socket minimal : la room n'en attend qu'une identité et deux méthodes. */
function fakeSocket(id: string): Socket {
  return { id, data: {}, join: () => undefined, leave: () => undefined, emit: () => undefined } as unknown as Socket;
}

function startedRoom(pace: 'live' | 'async', turnSeconds = 30): Room {
  const room = new Room(
    fakeIo(),
    'TEST',
    { id: 'alice', pseudo: 'Alice', avatar: 'a1' },
    {},
    { botDelayMs: 0, turnSeconds },
  );
  room.apply({ type: 'ADD_PLAYER', player: { id: 'bob', pseudo: 'Bob', avatar: 'a2' } });
  room.apply({ type: 'ADD_PLAYER', player: { id: 'carol', pseudo: 'Carol', avatar: 'a3' } });
  room.apply({ type: 'SET_PACE', playerId: 'alice', pace });
  room.apply({ type: 'START_GAME', playerId: 'alice' });
  return room;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('rythme asynchrone', () => {
  it("n'arme aucun compte à rebours de tour", () => {
    vi.useFakeTimers();
    const live = startedRoom('live');
    const async = startedRoom('async');

    expect(live.turnDeadline).not.toBeNull();
    expect(async.turnDeadline).toBeNull();
  });

  it('laisse un joueur absent prendre tout son temps', () => {
    vi.useFakeTimers();
    const room = startedRoom('async');
    const waiting = room.state.players.find((p) => p.seat === room.state.round!.currentSeat)!;

    vi.advanceTimersByTime(24 * 3_600_000);

    expect(room.state.round!.bids[waiting.id]).toBeNull();
  });

  it('ne joue pas à la place de qui ferme l’application', () => {
    vi.useFakeTimers();
    const room = startedRoom('async');
    const waiting = room.state.players.find((p) => p.seat === room.state.round!.currentSeat)!;
    const socket = fakeSocket('s1');
    room.attach(waiting.id, socket);

    room.detach(waiting.id, socket);
    vi.advanceTimersByTime(GRACE_SECONDS * 4_000);

    expect(room.state.round!.bids[waiting.id]).toBeNull();
    expect(room.state.players.find((p) => p.id === waiting.id)!.connected).toBe(false);
  });

  it('joue quand même pour qui quitte volontairement la partie', () => {
    vi.useFakeTimers();
    const room = startedRoom('async');
    const waiting = room.state.players.find((p) => p.seat === room.state.round!.currentSeat)!;
    const socket = fakeSocket('s1');
    room.attach(waiting.id, socket);

    // Claquer la porte est explicite : la table ne doit pas rester bloquée.
    room.leave(waiting.id, socket);
    vi.advanceTimersByTime(5_000);

    expect(room.state.round!.bids[waiting.id]).not.toBeNull();
  });

  it('laisse n’importe quel joueur relancer la manche', () => {
    vi.useFakeTimers();
    const room = startedRoom('async');
    // On déroule la manche de 1 carte jusqu'au décompte.
    for (let guard = 0; guard < 40 && room.state.phase !== 'round-scoring'; guard++) {
      const s = room.state;
      const current = s.players.find((p) => p.seat === s.round!.currentSeat)!;
      if (s.phase === 'bidding') {
        // Manche d'une carte : annoncer 0 reste légal pour tout le monde,
        // la règle du crochet n'interdit que la somme exacte.
        room.apply({ type: 'BID', playerId: current.id, bid: 0 });
      } else {
        room.apply({
          type: 'PLAY_CARD',
          playerId: current.id,
          cardId: `${s.round!.hands[current.id][0].suit}${s.round!.hands[current.id][0].rank}`,
        });
      }
    }
    expect(room.state.phase).toBe('round-scoring');

    // Un joueur qui n'est pas l'hôte peut passer à la manche suivante.
    const other = room.state.players.find((p) => p.id !== room.state.hostId)!;
    const res = room.apply({ type: 'NEXT_ROUND', playerId: other.id });
    expect(res.ok).toBe(true);
    expect(room.state.phase).toBe('bidding');
  });

  it('réserve la relance à l’hôte en temps réel', () => {
    const room = startedRoom('live', 0);
    for (let guard = 0; guard < 40 && room.state.phase !== 'round-scoring'; guard++) {
      const s = room.state;
      const current = s.players.find((p) => p.seat === s.round!.currentSeat)!;
      if (s.phase === 'bidding') {
        // Manche d'une carte : annoncer 0 reste légal pour tout le monde,
        // la règle du crochet n'interdit que la somme exacte.
        room.apply({ type: 'BID', playerId: current.id, bid: 0 });
      } else {
        room.apply({
          type: 'PLAY_CARD',
          playerId: current.id,
          cardId: `${s.round!.hands[current.id][0].suit}${s.round!.hands[current.id][0].rank}`,
        });
      }
    }
    const other = room.state.players.find((p) => p.id !== room.state.hostId)!;
    expect(room.apply({ type: 'NEXT_ROUND', playerId: other.id })).toEqual({ ok: false, error: 'NOT_HOST' });
  });
});

describe('balayage des parties inactives', () => {
  function managerWith(pace: 'live' | 'async'): { manager: RoomManager; code: string } {
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });
    const room = manager.create({ id: 'alice', pseudo: 'Alice', avatar: 'a1' });
    room.apply({ type: 'ADD_PLAYER', player: { id: 'bob', pseudo: 'Bob', avatar: 'a2' } });
    room.apply({ type: 'ADD_PLAYER', player: { id: 'carol', pseudo: 'Carol', avatar: 'a3' } });
    room.apply({ type: 'SET_PACE', playerId: 'alice', pace });
    room.apply({ type: 'START_GAME', playerId: 'alice' });
    return { manager, code: room.code };
  }

  it('ferme une partie temps réel désertée', () => {
    const { manager, code } = managerWith('live');
    manager.sweep(Date.now() + 60 * 60_000);
    expect(manager.get(code)).toBeUndefined();
    manager.stop();
  });

  it('garde une partie asynchrone désertée', () => {
    const { manager, code } = managerWith('async');
    // Une semaine sans que personne n'ouvre l'application : c'est normal.
    manager.sweep(Date.now() + 7 * 24 * 3_600_000);
    expect(manager.get(code)).toBeDefined();
    manager.stop();
  });

  it('finit par fermer une partie asynchrone que plus personne n’ouvre', () => {
    const { manager, code } = managerWith('async');
    manager.sweep(Date.now() + 30 * 24 * 3_600_000);
    expect(manager.get(code)).toBeUndefined();
    manager.stop();
  });
});

describe('liste des parties en cours', () => {
  it('remonte les parties du joueur, celles qui l’attendent d’abord', () => {
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });
    const rooms = [0, 1].map(() => {
      const room = manager.create({ id: 'alice', pseudo: 'Alice', avatar: 'a1' });
      room.apply({ type: 'ADD_PLAYER', player: { id: 'bob', pseudo: 'Bob', avatar: 'a2' } });
      room.apply({ type: 'ADD_PLAYER', player: { id: 'carol', pseudo: 'Carol', avatar: 'a3' } });
      room.apply({ type: 'SET_PACE', playerId: 'alice', pace: 'async' });
      room.apply({ type: 'START_GAME', playerId: 'alice' });
      return room;
    });

    const games = manager.gamesOf('alice');
    expect(games).toHaveLength(2);
    expect(games.map((g) => g.code).sort()).toEqual(rooms.map((r) => r.code).sort());
    // Celles qui attendent après nous passent devant.
    expect(games.map((g) => g.myTurn)).toEqual([...games].sort((a, b) => Number(b.myTurn) - Number(a.myTurn)).map((g) => g.myTurn));
    for (const g of games) {
      expect(g.pace).toBe('async');
      expect(g.playersCount).toBe(3);
      expect(g.roundsTotal).toBeGreaterThan(0);
      // La table attend forcément quelqu'un pendant les annonces.
      expect(g.waitingFor).not.toBeNull();
    }

    expect(manager.gamesOf('dave')).toEqual([]);
    manager.stop();
  });

  it('ignore les parties terminées', () => {
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });
    const room = manager.create({ id: 'alice', pseudo: 'Alice', avatar: 'a1' });
    room.apply({ type: 'ADD_PLAYER', player: { id: 'bob', pseudo: 'Bob', avatar: 'a2' } });
    room.apply({ type: 'ADD_PLAYER', player: { id: 'carol', pseudo: 'Carol', avatar: 'a3' } });
    room.apply({ type: 'START_GAME', playerId: 'alice' });
    expect(manager.gamesOf('alice')).toHaveLength(1);

    room.state = { ...room.state, phase: 'game-over' };
    expect(manager.gamesOf('alice')).toEqual([]);
    manager.stop();
  });
});
