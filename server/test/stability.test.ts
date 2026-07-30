import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import type { Server, Socket } from 'socket.io';
import {
  botBid,
  botCard,
  lowestLegalBid,
  lowestLegalCard,
  type GameView,
  type Player,
} from '@rikiki/shared';
import { GRACE_SECONDS, Room, type RoomOptions } from '../src/rooms/Room';
import { RoomManager } from '../src/rooms/RoomManager';
import type { LiveRoomsRepo } from '../src/db/rooms.repo';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';

/**
 * Stabilité des connexions.
 *
 * Un joueur réel a décrit une « catastrophe de stabilité » : téléphone mis en
 * veille trente secondes, socket coupé, et au retour le salon avait disparu,
 * le rôle d'hôte était passé à quelqu'un d'autre, ou la partie refusait de le
 * reprendre. Chaque test ci-dessous fixe l'un de ces comportements pour qu'il
 * ne puisse plus régresser en silence.
 *
 * Deux niveaux :
 *  - `Room` / `RoomManager` seuls, avec de faux sockets et des faux timers :
 *    tout ce qui touche au délai de grâce s'y teste sans attendre 90 secondes
 *    et sans la moindre part de hasard ;
 *  - un vrai serveur Socket.IO pour la reconnexion de bout en bout et le
 *    redémarrage du processus, où l'attente se fait toujours sur une condition
 *    (`waitView`) et jamais sur un délai arbitraire.
 */

/* ------------------------------------------------------------------ */
/* Outillage : faux io, faux sockets, rooms de test                    */
/* ------------------------------------------------------------------ */

function fakeIo(): Server {
  return { to: () => ({ emit: () => undefined }) } as unknown as Server;
}

/** Socket minimal, qui conserve les vues reçues pour pouvoir les inspecter. */
type TestSocket = Socket & { received: GameView[] };

function fakeSocket(id: string): TestSocket {
  const received: GameView[] = [];
  return {
    id,
    data: {},
    join: () => undefined,
    leave: () => undefined,
    emit: (event: string, payload: unknown) => {
      if (event === 'game:view') received.push(payload as GameView);
    },
    received,
  } as unknown as TestSocket;
}

const ALICE = { id: 'alice', pseudo: 'Alice', avatar: 'a1' };
const BOB = { id: 'bob', pseudo: 'Bob', avatar: 'a2' };
const CAROL = { id: 'carol', pseudo: 'Carol', avatar: 'a3' };

/** Salon de trois humains, sans robot, minuteur de tour neutralisé. */
function lobbyRoom(options: RoomOptions = {}): Room {
  const room = new Room(fakeIo(), 'TEST', ALICE, {}, { botDelayMs: 0, turnSeconds: 0, ...options });
  room.apply({ type: 'ADD_PLAYER', player: BOB });
  room.apply({ type: 'ADD_PLAYER', player: CAROL });
  return room;
}

/**
 * Partie lancée. Le `seed` permet des distributions reproductibles : sans lui
 * la donne dépend d'un `crypto.randomUUID()` et un test sur les annonces
 * deviendrait aléatoire.
 */
function startedRoom(options: RoomOptions = {}, seed?: string): Room {
  const room = lobbyRoom(options);
  if (seed) room.state = { ...room.state, seed };
  room.apply({ type: 'START_GAME', playerId: ALICE.id });
  return room;
}

function attachAll(room: Room, suffix = ''): Map<string, TestSocket> {
  const sockets = new Map<string, TestSocket>();
  for (const p of room.state.players) {
    const s = fakeSocket(`sock-${p.id}${suffix}`);
    sockets.set(p.id, s);
    room.attach(p.id, s);
  }
  return sockets;
}

function currentPlayer(room: Room): Player {
  const seat = room.state.round!.currentSeat;
  return room.state.players.find((p) => p.seat === seat)!;
}

/** Annonce pour tout le monde (option la plus basse), en s'arrêtant sur `skip`. */
function bidAll(room: Room, skip?: string): void {
  while (room.state.phase === 'bidding') {
    const cur = currentPlayer(room);
    if (cur.id === skip) return;
    room.apply({ type: 'BID', playerId: cur.id, bid: lowestLegalBid(room.state, cur.id) });
  }
}

/** Déroule la manche en cours jusqu'au décompte. */
function playRound(room: Room): void {
  bidAll(room);
  while (room.state.phase === 'playing') {
    const cur = currentPlayer(room);
    room.apply({ type: 'PLAY_CARD', playerId: cur.id, cardId: lowestLegalCard(room.state, cur.id) });
  }
}

/** Amène la partie au début de la manche `target` (phase d'annonces). */
function advanceToRound(room: Room, target: number): void {
  while (room.state.round!.roundIndex < target) {
    playRound(room);
    room.apply({ type: 'NEXT_ROUND', playerId: room.state.hostId });
  }
}

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ */
/* 1. Le rôle d'hôte se prête, il ne se perd pas                        */
/* ------------------------------------------------------------------ */

describe('rôle d’hôte', () => {
  /*
   * LE bug rapporté. L'organisateur met son téléphone en veille pendant que
   * les autres arrivent ; quatre-vingt-dix secondes plus tard son siège est
   * libéré et un invité tient la barre. À son retour il ne pouvait plus rien
   * faire : ni lancer la partie, ni ajouter un robot, ni changer le format.
   */
  it('rend la main au fondateur qui revient dans le salon', () => {
    vi.useFakeTimers();
    const room = lobbyRoom();
    const sockets = attachAll(room);

    room.detach(ALICE.id, sockets.get(ALICE.id)!);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);

    // Le salon ne reste pas sans pilote : un invité présent prend le relais.
    expect(room.state.players.some((p) => p.id === ALICE.id)).toBe(false);
    expect(room.state.hostId).toBe(BOB.id);

    // Elle revient : elle rejoint comme n'importe qui, mais reprend la barre.
    room.apply({ type: 'ADD_PLAYER', player: ALICE });
    room.attach(ALICE.id, fakeSocket('alice-retour'));

    expect(room.state.hostId).toBe(ALICE.id);
    expect(room.apply({ type: 'START_GAME', playerId: ALICE.id }).ok).toBe(true);
  });

  it('rend la main au fondateur qui revient en pleine partie', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    const sockets = attachAll(room);

    room.detach(ALICE.id, sockets.get(ALICE.id)!);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);
    expect(room.state.hostId).toBe(BOB.id);

    room.attach(ALICE.id, fakeSocket('alice-retour'));
    expect(room.state.hostId).toBe(ALICE.id);
    // Elle est de nouveau la seule à pouvoir relancer la manche suivante.
    expect(room.state.players.find((p) => p.id === ALICE.id)!.connected).toBe(true);
  });

  it('laisse la barre à l’invité promu tant que le fondateur n’est pas revenu', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    const sockets = attachAll(room);

    room.detach(ALICE.id, sockets.get(ALICE.id)!);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);

    // Bob mène la partie ; personne ne lui reprend le rôle par surprise.
    expect(room.state.hostId).toBe(BOB.id);
    room.detach(CAROL.id, sockets.get(CAROL.id)!);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);
    expect(room.state.hostId).toBe(BOB.id);
  });

  /*
   * Régression sous surveillance — corrigée, ce test la garde fermée.
   *
   * Le fondateur n'est retenu qu'en mémoire (`founderId`, champ privé de
   * `Room`), et n'est pas persisté. Or `Room.restore` reprend comme fondateur
   * le `hostId` de l'état sauvegardé : si le rôle avait été transmis pendant
   * l'absence de l'organisateur, un simple redémarrage du serveur grave la
   * promotion dans le marbre. L'organisateur revient, et cette fois il ne
   * récupère plus rien — exactement le symptôme rapporté, avec un déclencheur
   * de plus (un déploiement au mauvais moment).
   *
   */
  it('CORRIGÉ : le fondateur ne récupère pas son rôle après un redémarrage', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    const sockets = attachAll(room);

    room.detach(ALICE.id, sockets.get(ALICE.id)!);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);
    expect(room.state.hostId).toBe(BOB.id);

    // Redémarrage du serveur : la partie est rechargée depuis son état.
    const restored = Room.restore(fakeIo(), room.state, {}, { botDelayMs: 0, turnSeconds: 0 })!;
    restored.attach(ALICE.id, fakeSocket('alice-retour'));

    expect(restored.state.hostId).toBe(ALICE.id);
    restored.close('fin de test');
  });

  it('ne promeut jamais un robot', () => {
    vi.useFakeTimers();
    const room = new Room(fakeIo(), 'TEST', ALICE, {}, { botDelayMs: 0, turnSeconds: 0 });
    room.addBot();
    room.addBot();
    room.apply({ type: 'START_GAME', playerId: ALICE.id });
    const socket = fakeSocket('alice');
    room.attach(ALICE.id, socket);

    room.detach(ALICE.id, socket);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 10);

    // Aucun humain connecté : l'hôte reste en place, ses coups sont joués.
    expect(room.state.hostId).toBe(ALICE.id);
  });
});

/* ------------------------------------------------------------------ */
/* 2. Le salon survit à une déconnexion                                 */
/* ------------------------------------------------------------------ */

describe('salon et déconnexion', () => {
  function managedLobby(): { manager: RoomManager; room: Room } {
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });
    const room = manager.create(ALICE);
    room.apply({ type: 'ADD_PLAYER', player: BOB });
    room.apply({ type: 'ADD_PLAYER', player: CAROL });
    return { manager, room };
  }

  /*
   * Verrouiller son écran coupe le socket. Le joueur était alors retiré du
   * salon sur-le-champ : les autres voyaient sa place se libérer, et s'il
   * était seul avec des robots la table se fermait — il revenait dans une
   * partie qui n'existait plus.
   */
  it('garde le joueur déconnecté, marqué absent, pendant le délai de grâce', () => {
    vi.useFakeTimers();
    const { manager, room } = managedLobby();
    const sockets = attachAll(room);

    room.detach(BOB.id, sockets.get(BOB.id)!);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 - 1000);

    const bob = room.state.players.find((p) => p.id === BOB.id);
    expect(bob).toBeDefined();
    expect(bob!.connected).toBe(false);
    expect(room.state.players).toHaveLength(3);
    expect(manager.get(room.code)).toBeDefined();

    // Il revient avant l'échéance : il retrouve son siège, pas un nouveau.
    room.attach(BOB.id, fakeSocket('bob-retour'));
    expect(room.state.players.find((p) => p.id === BOB.id)!.connected).toBe(true);
    expect(room.state.players.find((p) => p.id === BOB.id)!.seat).toBe(bob!.seat);
    expect(room.state.players).toHaveLength(3);

    manager.stop();
  });

  it('ne ferme pas la table quand son seul humain met son téléphone en veille', () => {
    vi.useFakeTimers();
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });
    const room = manager.create(ALICE);
    room.addBot();
    room.addBot();
    const socket = fakeSocket('alice');
    room.attach(ALICE.id, socket);

    room.detach(ALICE.id, socket);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 - 1000);

    // La table existe encore : c'est tout l'enjeu du délai de grâce.
    expect(manager.get(room.code)).toBeDefined();
    room.attach(ALICE.id, fakeSocket('alice-retour'));
    expect(manager.get(room.code)).toBeDefined();
    expect(room.state.players).toHaveLength(3);
    expect(room.state.hostId).toBe(ALICE.id);

    manager.stop();
  });

  /*
   * Régression sous surveillance — corrigée, ce test la garde fermée.
   *
   * Le délai de grâce accordé au salon exécute `removePlayer`, qui est refusé
   * par le moteur hors phase `lobby` (`BAD_PHASE`). Si l'hôte lance la partie
   * pendant l'absence d'un invité, l'échéance passe donc sans rien faire : le
   * joueur n'est jamais basculé en jeu automatique. Concrètement, chacun de
   * ses tours attend les 45 secondes du minuteur de tour au lieu des 800 ms
   * de l'auto-play — et si le minuteur est désactivé (parties sans limite),
   * la table est bloquée. Le correctif tient en une ligne : appeler
   * `onGraceExpired` quand la phase n'est plus `lobby`.
   */
  it('CORRIGÉ : absent au lancement, jamais basculé en jeu automatique', () => {
    vi.useFakeTimers();
    const room = lobbyRoom();
    const sockets = attachAll(room);

    // Bob verrouille son téléphone dans le salon ; Alice lance quand même.
    room.detach(BOB.id, sockets.get(BOB.id)!);
    expect(room.apply({ type: 'START_GAME', playerId: ALICE.id }).ok).toBe(true);
    vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 5_000);

    // Les présents annoncent : la table attend Bob.
    bidAll(room, BOB.id);
    expect(currentPlayer(room).id).toBe(BOB.id);
    vi.advanceTimersByTime(10 * 60_000);

    expect(room.state.round!.bids[BOB.id]).not.toBeNull();
  });

  it('libère le siège sur-le-champ quand le départ est explicite', () => {
    vi.useFakeTimers();
    // Room nue (sans gestionnaire) : le décompte des minuteurs ne mesure alors
    // que ceux de la room, pas le balayage périodique ni l'écriture en base.
    const room = lobbyRoom();
    const sockets = attachAll(room);

    // Claquer la porte n'est pas une coupure subie : aucune raison d'attendre.
    room.leave(BOB.id, sockets.get(BOB.id)!);

    expect(room.state.players.map((p) => p.id)).toEqual([ALICE.id, CAROL.id]);
    expect(room.state.players.map((p) => p.seat)).toEqual([0, 1]);
    // Et aucun minuteur de grâce ne traîne derrière un départ volontaire.
    expect(vi.getTimerCount()).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* 3. Reconnexions en rafale                                            */
/* ------------------------------------------------------------------ */

describe('reconnexions en rafale', () => {
  /*
   * Un réseau mobile instable enchaîne les coupures. Chaque cycle crée un
   * nouveau socket et arme un minuteur de grâce : si l'un d'eux survit, ou si
   * un `ADD_PLAYER` de reconnexion ajoutait un siège, la table finirait avec
   * des joueurs fantômes et des minuteurs qui jouent tout seuls.
   */
  it('n’ajoute ni siège fantôme ni doublon en dix cycles (salon)', () => {
    vi.useFakeTimers();
    const room = lobbyRoom();
    attachAll(room);

    for (let i = 0; i < 10; i++) {
      const socket = fakeSocket(`bob-${i}`);
      room.attach(BOB.id, socket);
      room.detach(BOB.id, socket);
      // Chaque coupure dure moins que le délai de grâce.
      vi.advanceTimersByTime(1_000);
    }
    room.attach(BOB.id, fakeSocket('bob-final'));

    const ids = room.state.players.map((p) => p.id);
    expect(ids).toEqual([ALICE.id, BOB.id, CAROL.id]);
    expect(new Set(ids).size).toBe(3);
    expect(room.state.players.map((p) => p.seat)).toEqual([0, 1, 2]);
    expect(room.sockets.size).toBe(3);
    expect(room.connectedCount()).toBe(3);
    expect(room.state.players.every((p) => p.connected)).toBe(true);
    // Aucun minuteur orphelin : tous les délais de grâce ont été désarmés.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('n’ajoute ni siège fantôme ni minuteur orphelin en dix cycles (en partie)', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    attachAll(room);
    const handBefore = room.state.round!.hands[BOB.id];

    for (let i = 0; i < 10; i++) {
      const socket = fakeSocket(`bob-${i}`);
      room.attach(BOB.id, socket);
      room.detach(BOB.id, socket);
      vi.advanceTimersByTime(1_000);
    }
    const last = fakeSocket('bob-final');
    room.attach(BOB.id, last);

    expect(room.state.players).toHaveLength(3);
    expect(room.sockets.size).toBe(3);
    // Sa main n'a pas bougé : personne n'a joué à sa place.
    expect(room.state.round!.hands[BOB.id]).toEqual(handBefore);
    expect(room.state.round!.bids[BOB.id]).toBeNull();
    // Et il reçoit de nouveau les vues.
    expect(last.received.length).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* 4. Un absent est remplacé par un vrai robot                          */
/* ------------------------------------------------------------------ */

describe('remplacement d’un joueur absent', () => {
  /*
   * L'absent était joué « au plus petit » : annonce 0, plus petite carte. Il
   * ramassait des plis par accident, sabotait son score et faussait la partie
   * des autres — au point que revenir dans sa partie n'avait plus d'intérêt.
   * Il hérite désormais de la stratégie complète du robot.
   *
   * On le vérifie de deux façons : l'action jouée est EXACTEMENT celle que
   * `botBid`/`botCard` auraient choisie sur le même état, et sur un
   * échantillon de donnes elle diffère de l'option minimale.
   */
  const SEEDS = ['graine-1', 'graine-2', 'graine-3', 'graine-4', 'graine-5', 'graine-6', 'graine-7', 'graine-8'];

  it('annonce comme le robot, et pas systématiquement le minimum', () => {
    vi.useFakeTimers();
    const bids: number[] = [];
    let differsFromLowest = 0;

    for (const seed of SEEDS) {
      const room = startedRoom({}, seed);
      const sockets = attachAll(room);
      // Manche de 5 cartes : à une carte, toutes les stratégies se rejoignent.
      advanceToRound(room, 4);
      expect(room.state.round!.cardsCount).toBe(5);

      const absent = currentPlayer(room);
      room.detach(absent.id, sockets.get(absent.id)!);
      // Fin du délai de grâce : le siège passe en jeu automatique…
      vi.advanceTimersByTime(GRACE_SECONDS * 1000);
      const before = room.state;
      const expected = botBid(before, absent.id);
      const lowest = lowestLegalBid(before, absent.id);
      // …et l'action est jouée peu après.
      vi.advanceTimersByTime(2_000);

      const played = room.state.round!.bids[absent.id];
      expect(played).toBe(expected);
      bids.push(played!);
      if (expected !== lowest) differsFromLowest++;

      room.close('fin de test');
    }

    // Un joueur qui annonce 0 à chaque fois est le symptôme exact du bug.
    expect(bids.some((b) => b > 0)).toBe(true);
    expect(differsFromLowest).toBeGreaterThan(0);
  });

  it('choisit ses cartes comme le robot, et pas la plus petite', () => {
    vi.useFakeTimers();
    let compared = 0;
    let differsFromLowest = 0;

    for (const seed of SEEDS) {
      const room = startedRoom({}, seed);
      const sockets = attachAll(room);
      advanceToRound(room, 4);

      const absent = currentPlayer(room);
      room.detach(absent.id, sockets.get(absent.id)!);
      vi.advanceTimersByTime(GRACE_SECONDS * 1000 + 2_000);
      // Les présents annoncent : on arrive en phase de jeu.
      bidAll(room);
      expect(room.state.phase).toBe('playing');

      // On joue jusqu'à ce que l'absent soit attendu.
      let guard = 0;
      while (room.state.phase === 'playing' && guard++ < 20) {
        const cur = currentPlayer(room);
        if (cur.id === absent.id) break;
        room.apply({ type: 'PLAY_CARD', playerId: cur.id, cardId: lowestLegalCard(room.state, cur.id) });
      }
      expect(currentPlayer(room).id).toBe(absent.id);

      const before = room.state;
      const expected = botCard(before, absent.id);
      const lowest = lowestLegalCard(before, absent.id);
      const handBefore = before.round!.hands[absent.id].length;
      vi.advanceTimersByTime(2_000);

      expect(room.state.round!.hands[absent.id]).toHaveLength(handBefore - 1);
      const playedCard = room.state.round!.currentTrick.plays.find((p) => p.playerId === absent.id)?.card;
      const playedId = playedCard ? `${playedCard.suit}${playedCard.rank}` : null;
      expect(playedId).toBe(expected);
      compared++;
      if (expected !== lowest) differsFromLowest++;

      room.close('fin de test');
    }

    expect(compared).toBe(SEEDS.length);
    expect(differsFromLowest).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 5. Aucune fuite                                                      */
/* ------------------------------------------------------------------ */

describe('fuites de minuteurs', () => {
  it('ne laisse aucun délai de grâce derrière une room fermée', () => {
    vi.useFakeTimers();
    const room = startedRoom();
    const sockets = attachAll(room);
    room.detach(BOB.id, sockets.get(BOB.id)!);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    room.close('expired');

    expect(vi.getTimerCount()).toBe(0);
    expect(room.sockets.size).toBe(0);
  });

  /*
   * Régression sous surveillance — corrigée, ce test la garde fermée.
   *
   * `clearTimers()` désarme les délais de grâce, l'auto-play et l'écriture en
   * base, mais oublie `turnTimer`. Une room fermée garde donc un minuteur de
   * tour armé jusqu'à 45 secondes après sa disparition. Il est `unref`, donc
   * il n'empêche pas le processus de sortir — mais il maintient en vie toute
   * la room (état, joueurs, mains) et il finit par s'exécuter (voir le test
   * suivant). Correctif : ajouter `turnTimer` à `clearTimers()`.
   */
  it('CORRIGÉ : le minuteur de tour survit à la fermeture de la room', () => {
    vi.useFakeTimers();
    const room = startedRoom({ turnSeconds: 45 });
    attachAll(room);
    expect(room.turnDeadline).not.toBeNull();

    room.close('expired');

    expect(vi.getTimerCount()).toBe(0);
  });

  /*
   * Régression sous surveillance — corrigée, ce test la garde fermée.
   *
   * Conséquence directe du précédent : quand le minuteur de tour orphelin
   * s'exécute, il joue un coup sur une room déjà fermée, ce qui rappelle
   * `schedulePersist()` — et réécrit en base une ligne que `RoomManager.remove`
   * venait de supprimer. La partie fantôme est alors rechargée au prochain
   * démarrage du serveur, avec des joueurs qui n'y sont plus. C'est une source
   * plausible de « je rejoins une partie qui n'existe plus ».
   */
  it('CORRIGÉ : une room fermée réécrit son état en base', () => {
    vi.useFakeTimers();
    const saves: string[] = [];
    const deletes: string[] = [];
    const live = {
      save: (code: string) => saves.push(code),
      delete: (code: string) => deletes.push(code),
      loadAll: () => [],
      deleteOlderThan: () => undefined,
    } as unknown as LiveRoomsRepo;

    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 45 }, live);
    const room = manager.create(ALICE);
    room.apply({ type: 'ADD_PLAYER', player: BOB });
    room.apply({ type: 'ADD_PLAYER', player: CAROL });
    attachAll(room);
    room.apply({ type: 'START_GAME', playerId: ALICE.id });
    const code = room.code;

    manager.remove(code, 'expired');
    expect(deletes).toContain(code);
    saves.length = 0;

    vi.advanceTimersByTime(2 * 60_000);

    expect(saves).toEqual([]);
    manager.stop();
  });

  it('libère tout au `stop()` du gestionnaire', () => {
    vi.useFakeTimers();
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });
    const codes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const room = manager.create(ALICE);
      room.apply({ type: 'ADD_PLAYER', player: BOB });
      const sockets = attachAll(room);
      room.detach(BOB.id, sockets.get(BOB.id)!);
      codes.push(room.code);
    }
    // Cinq délais de grâce + le balayage périodique du gestionnaire.
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(6);

    manager.stop();

    expect(vi.getTimerCount()).toBe(0);
    for (const code of codes) expect(manager.get(code)).toBeUndefined();
  });
});


/* ------------------------------------------------------------------ */
/* 6. De bout en bout : vrai serveur, vrais sockets                     */
/* ------------------------------------------------------------------ */

type App = ReturnType<typeof createApp>;

let tmpDir: string;
let dbPath: string;
let server: App;
let running = false;
let baseUrl: string;

/** Client de test : mêmes conventions que `socket.integration.test.ts`. */
class TestClient {
  socket!: ClientSocket;
  views: GameView[] = [];
  constructor(
    public pseudo: string,
    public token: string,
    public userId: string,
  ) {}

  connect(): Promise<void> {
    this.socket = ioc(baseUrl, { auth: { token: this.token }, transports: ['websocket'], reconnection: false });
    this.socket.on('game:view', (view: GameView) => this.views.push(view));
    return new Promise((resolve, reject) => {
      this.socket.once('connect', () => resolve());
      this.socket.once('connect_error', reject);
    });
  }

  get view(): GameView | undefined {
    return this.views.at(-1);
  }

  emit<T = { ok: boolean }>(event: string, ...args: unknown[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`ack timeout: ${event}`)), 3000);
      this.socket.emit(event, ...args, (res: T) => {
        clearTimeout(timer);
        resolve(res);
      });
    });
  }

  waitView(pred: (v: GameView) => boolean, label = 'view', timeoutMs = 5000): Promise<GameView> {
    const existing = this.views.at(-1);
    if (existing && pred(existing)) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`waitView timeout: ${label} (${this.pseudo})`)), timeoutMs);
      const handler = (view: GameView) => {
        if (pred(view)) {
          clearTimeout(timer);
          this.socket.off('game:view', handler);
          resolve(view);
        }
      };
      this.socket.on('game:view', handler);
    });
  }
}

async function createUser(pseudo: string): Promise<TestClient> {
  const res = await fetch(`${baseUrl}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pseudo, avatar: '🦊' }),
  });
  expect(res.ok).toBe(true);
  const data = (await res.json()) as { token: string; user: { id: string } };
  return new TestClient(pseudo, data.token, data.user.id);
}

async function startServer(): Promise<void> {
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: dbPath,
    // Secret stable : les jetons émis avant le redémarrage restent valides.
    JWT_SECRET: 'secret-de-test-stabilite',
    PORT: '0',
    BOT_DELAY_MS: '0',
  } as NodeJS.ProcessEnv);
  server = createApp(config);
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
  running = true;
}

/** Coupe le serveur comme le ferait un SIGTERM (écriture, puis fermeture). */
async function stopServer(): Promise<void> {
  if (!running) return;
  running = false;
  server.rooms.flushAll();
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
}

describe('reconnexion de bout en bout', () => {
  let alice: TestClient, bob: TestClient, carol: TestClient;
  let code: string;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rikiki-stabilite-'));
    dbPath = path.join(tmpDir, 'rikiki.db');
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('monte une partie à trois et la lance', async () => {
    alice = await createUser('AliceStab');
    bob = await createUser('BobStab');
    carol = await createUser('CarolStab');
    await Promise.all([alice.connect(), bob.connect(), carol.connect()]);

    const created = await alice.emit<{ ok: boolean; code: string }>('room:create');
    code = created.code;
    expect((await bob.emit('room:join', { code })).ok).toBe(true);
    expect((await carol.emit('room:join', { code })).ok).toBe(true);
    await Promise.all([alice, bob, carol].map((c) => c.waitView((v) => v.players.length === 3, '3 joueurs')));

    expect((await alice.emit('game:start')).ok).toBe(true);
    await Promise.all([alice, bob, carol].map((c) => c.waitView((v) => v.phase === 'bidding', 'annonces')));
  });

  /*
   * Le cœur du problème rapporté : couper le socket en pleine partie ne doit
   * rien coûter. Même siège, même main, et le flux de vues reprend.
   */
  it('retrouve son siège, sa main et ses vues après une coupure', async () => {
    const handBefore = bob.view!.round!.myHand;
    const seatBefore = bob.view!.players.find((p) => p.id === bob.userId)!.seat;

    bob.socket.close();
    await alice.waitView((v) => v.players.find((p) => p.id === bob.userId)!.connected === false, 'bob absent');
    // La partie n'a pas bougé : personne n'a été retiré.
    expect(alice.view!.players).toHaveLength(3);

    const revenu = new TestClient('BobStab', bob.token, bob.userId);
    await revenu.connect();
    expect((await revenu.emit('room:join', { code })).ok).toBe(true);

    const v = await revenu.waitView((view) => view.round !== null, 'vue restaurée');
    expect(v.you).toBe(bob.userId);
    expect(v.round!.myHand).toEqual(handBefore);
    expect(v.players.find((p) => p.id === bob.userId)!.seat).toBe(seatBefore);
    expect(v.players).toHaveLength(3);
    await alice.waitView((view) => view.players.find((p) => p.id === bob.userId)!.connected === true, 'bob revenu');

    // Le flux continue : une action d'un tiers lui parvient bien.
    const before = revenu.views.length;
    const current = alice.view!.players.find((p) => p.seat === alice.view!.round!.currentSeat)!;
    const actor = [alice, revenu, carol].find((c) => c.userId === current.id)!;
    const myTurn = await actor.waitView((view) => view.round?.legalBids != null, 'mon tour');
    expect((await actor.emit('game:bid', { bid: myTurn.round!.legalBids![0] })).ok).toBe(true);
    await revenu.waitView((view) => view.round!.bids[current.id] !== null, 'annonce diffusée');
    expect(revenu.views.length).toBeGreaterThan(before);

    bob = revenu;
  });

  /*
   * Dix allers-retours d'affilée, comme un métro qui enchaîne les tunnels :
   * ni siège en double, ni joueur perdu, ni partie fermée.
   */
  it('encaisse dix reconnexions successives', async () => {
    for (let i = 0; i < 10; i++) {
      carol.socket.close();
      const suivante = new TestClient('CarolStab', carol.token, carol.userId);
      await suivante.connect();
      expect((await suivante.emit('room:join', { code })).ok).toBe(true);
      await suivante.waitView((v) => v.round !== null, `vue cycle ${i}`);
      carol = suivante;
    }

    const room = server.rooms.get(code)!;
    expect(room).toBeDefined();
    expect(room.state.players).toHaveLength(3);
    expect(new Set(room.state.players.map((p) => p.id)).size).toBe(3);
    expect(room.connectedCount()).toBe(3);
    expect(room.state.players.every((p) => p.connected)).toBe(true);
  });

  /*
   * Redémarrage du serveur en pleine partie : les sockets et les minuteurs
   * meurent avec le processus, mais la partie est en base. Les joueurs
   * doivent pouvoir reprendre là où ils en étaient.
   */
  it('reprend la partie après un redémarrage du serveur', async () => {
    const handBefore = alice.view!.round!.myHand;
    const totals = Object.fromEntries(alice.view!.players.map((p) => [p.id, p.totalScore]));
    for (const c of [alice, bob, carol]) c.socket.close();

    await stopServer();
    await startServer();

    const room = server.rooms.get(code);
    expect(room).toBeDefined();
    expect(room!.state.hostId).toBe(alice.userId);
    expect(room!.state.players).toHaveLength(3);

    const clients = [alice, bob, carol].map((c) => new TestClient(c.pseudo, c.token, c.userId));
    await Promise.all(clients.map((c) => c.connect()));
    for (const c of clients) expect((await c.emit('room:join', { code })).ok).toBe(true);

    const v = await clients[0].waitView((view) => view.round !== null, 'vue restaurée');
    expect(v.round!.myHand).toEqual(handBefore);
    expect(v.hostId).toBe(alice.userId);
    expect(v.players.map((p) => p.totalScore)).toEqual(v.players.map((p) => totals[p.id]));
    await Promise.all(clients.map((c) => c.waitView((view) => view.round !== null, 'vue de chacun')));
    expect(server.rooms.get(code)!.connectedCount()).toBe(3);

    // Et la partie repart vraiment : la manche va jusqu'au décompte.
    const deadline = Date.now() + 15_000;
    while (clients[0].view!.phase !== 'round-scoring' && Date.now() < deadline) {
      const view = clients[0].view!;
      const seat = view.round!.currentSeat;
      const actor = clients.find((c) => c.userId === view.players.find((p) => p.seat === seat)!.id)!;
      const mine = await actor.waitView((x) => x.round?.legalBids != null || x.round?.legalCardIds != null, 'mon tour');
      if (mine.round!.legalBids) await actor.emit('game:bid', { bid: mine.round!.legalBids[0] });
      else await actor.emit('game:playCard', { cardId: mine.round!.legalCardIds![0] });
    }
    expect(clients[0].view!.phase).toBe('round-scoring');

    for (const c of clients) c.socket.close();
  }, 30_000);
});
