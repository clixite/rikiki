import { describe, expect, it, vi, afterEach } from 'vitest';
import type { Server, Socket } from 'socket.io';
import { botCard, type GameView, type Player } from '@rikiki/shared';
import { GRACE_SECONDS, Room } from '../src/rooms/Room';
import { projectView } from '../src/sockets/views';

/**
 * La pause : s'absenter sans faire attendre la table, et sans la quitter.
 *
 * Un joueur réel l'a demandée en ces termes : « on devrait pouvoir faire une
 * pause (et être remplacé par un bot le temps de sa pause) ». Les tests ci-
 * dessous fixent les trois propriétés qui rendent la chose utilisable : la
 * table n'attend plus, le siège reste réservé, et le retour est un choix du
 * joueur — pas un effet de bord du réseau.
 */

function fakeIo(): Server {
  return { to: () => ({ emit: () => undefined }) } as unknown as Server;
}

function fakeSocket(id: string): Socket {
  return {
    id,
    data: {},
    join: () => undefined,
    leave: () => undefined,
    emit: () => undefined,
  } as unknown as Socket;
}

const ALICE = { id: 'alice', pseudo: 'Alice', avatar: 'a1' };
const BOB = { id: 'bob', pseudo: 'Bob', avatar: 'a2' };
const CAROL = { id: 'carol', pseudo: 'Carol', avatar: 'a3' };

/**
 * Fenêtre large devant le délai de remplacement automatique (800 ms côté
 * serveur). Les tests avancent le temps plutôt que d'attendre : ils restent
 * instantanés, et ne dépendent pas de la valeur exacte du délai.
 */
const AUTOPLAY_WINDOW_MS = 5_000;

/** Partie lancée, à distribution reproductible, robots instantanés. */
function startedRoom(seed = 'graine-pause'): Room {
  const room = new Room(fakeIo(), 'PAUS', ALICE, {}, { botDelayMs: 0, turnSeconds: 30 });
  room.apply({ type: 'ADD_PLAYER', player: BOB });
  room.apply({ type: 'ADD_PLAYER', player: CAROL });
  room.state = { ...room.state, seed };
  room.apply({ type: 'START_GAME', playerId: ALICE.id });
  return room;
}

function currentPlayer(room: Room): Player {
  const seat = room.state.round!.currentSeat;
  return room.state.players.find((p) => p.seat === seat)!;
}

function viewOf(room: Room, userId: string): GameView {
  return projectView(room.state, userId);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('pause', () => {
  it('marque le joueur en pause et le dit à toute la table', () => {
    const room = startedRoom();
    expect(room.setPaused(BOB.id, true)).toBe(true);

    // Tout le monde doit le voir : sinon les autres attendent quelqu'un qui
    // n'est plus là, en croyant à une simple lenteur.
    for (const who of [ALICE.id, BOB.id, CAROL.id]) {
      const bob = viewOf(room, who).players.find((p) => p.id === BOB.id)!;
      expect(bob.paused).toBe(true);
      // Une pause n'est pas une déconnexion : le joueur reste « présent ».
      expect(bob.connected).toBe(true);
    }
  });

  it('fait annoncer le robot à sa place, sans figer la table', () => {
    vi.useFakeTimers();
    const room = startedRoom();

    // On amène le tour sur Bob en faisant annoncer ceux qui le précèdent.
    while (currentPlayer(room).id !== BOB.id) {
      const cur = currentPlayer(room);
      room.apply({ type: 'BID', playerId: cur.id, bid: 0 });
    }
    expect(room.state.round!.bids[BOB.id]).toBeNull();

    room.setPaused(BOB.id, true);
    vi.advanceTimersByTime(AUTOPLAY_WINDOW_MS);

    // Le tour a avancé sans attendre Bob : la table ne s'est pas figée.
    expect(room.state.round!.bids[BOB.id]).not.toBeNull();
    expect(currentPlayer(room).id).not.toBe(BOB.id);
  });

  it('joue la carte du robot, pas la plus basse par défaut', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    while (room.state.phase === 'bidding') {
      const cur = currentPlayer(room);
      room.apply({ type: 'BID', playerId: cur.id, bid: 0 });
    }

    const absent = currentPlayer(room);
    // Ce qu'un vrai robot jouerait sur CET état, calculé avant la pause.
    const expected = botCard(room.state, absent.id);

    room.setPaused(absent.id, true);
    vi.advanceTimersByTime(AUTOPLAY_WINDOW_MS);

    const played = room.state.round!.currentTrick.plays.find((p) => p.playerId === absent.id);
    expect(played).toBeDefined();
    expect(`${played!.card.suit}${played!.card.rank}`).toBe(expected);
  });

  it('n’arme aucun compte à rebours sur le tour d’un joueur en pause', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    while (currentPlayer(room).id !== BOB.id) {
      const cur = currentPlayer(room);
      room.apply({ type: 'BID', playerId: cur.id, bid: 0 });
    }
    room.setPaused(BOB.id, true);

    // Aucune échéance n'est diffusée tant que le tour est celui de l'absent :
    // afficher un compte à rebours sur quelqu'un qui ne joue pas ferait
    // attendre la table pour rien.
    expect(room.turnDeadline).toBeNull();

    // Puis le robot annonce pour lui, et le tour repart.
    vi.advanceTimersByTime(AUTOPLAY_WINDOW_MS);
    const awaited = currentPlayer(room);
    expect(awaited.id).not.toBe(BOB.id);
    expect(awaited.paused ?? false).toBe(false);
  });

  it('ne lève pas la pause à la reconnexion — seul le joueur en sort', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    const sock = fakeSocket('bob-1');
    room.attach(BOB.id, sock);

    room.setPaused(BOB.id, true);
    room.detach(BOB.id, sock);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);

    room.attach(BOB.id, fakeSocket('bob-2'));
    const bob = viewOf(room, BOB.id).players.find((p) => p.id === BOB.id)!;
    expect(bob.connected).toBe(true);
    // Rouvrir l'application n'annonce pas qu'on est revenu à table : c'est le
    // bouton « je reprends » qui le dit, et lui seul.
    expect(bob.paused).toBe(true);
  });

  it('rend la main au joueur quand il reprend', () => {
    const room = startedRoom();
    room.setPaused(CAROL.id, true);
    expect(room.setPaused(CAROL.id, false)).toBe(true);

    const carol = viewOf(room, CAROL.id).players.find((p) => p.id === CAROL.id)!;
    expect(carol.paused ?? false).toBe(false);
  });

  it('rend aussi la barre au fondateur qui reprend après avoir cédé le rôle', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    const sock = fakeSocket('alice-1');
    room.attach(ALICE.id, sock);
    room.attach(BOB.id, fakeSocket('bob-1'));

    room.setPaused(ALICE.id, true);
    room.detach(ALICE.id, sock);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);
    expect(room.state.hostId).toBe(BOB.id);

    // Elle revient et reprend : la barre lui revient dans le même geste, sans
    // qu'elle ait à comprendre pourquoi elle l'avait perdue.
    room.attach(ALICE.id, fakeSocket('alice-2'));
    room.setPaused(ALICE.id, false);
    expect(room.state.hostId).toBe(ALICE.id);
  });

  it('refuse la pause d’un robot ou d’un inconnu', () => {
    const room = startedRoom();
    expect(room.setPaused('inconnu', true)).toBe(false);

    // Un robot est déjà automatique : le mettre en pause n'aurait aucun sens,
    // et afficherait « en pause » sur un joueur qui continue de jouer.
    const lobby = new Room(fakeIo(), 'PAU2', ALICE, {}, { botDelayMs: 0, turnSeconds: 0 });
    const added = lobby.addBot();
    expect(added.ok).toBe(true);
    if (added.ok) expect(lobby.setPaused(added.player.id, true)).toBe(false);
  });
});
