import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import type { Server, Socket } from 'socket.io';
import { lowestLegalBid, lowestLegalCard, type GameAction, type GameView } from '@rikiki/shared';
import { Room } from '../src/rooms/Room';
import { RoomManager } from '../src/rooms/RoomManager';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';

/**
 * Tenue en charge.
 *
 * Ces tests ne sont PAS un banc d'essai : ils ne mesurent pas la vitesse de
 * la machine, ils protègent contre une régression algorithmique — une donne
 * recalculée à chaque vue, une diffusion en O(n²), un état cloné dans une
 * boucle de pli. Une telle régression multiplie les temps par dix ou cent,
 * pas par deux.
 *
 * Les seuils sont donc volontairement larges — d'un ordre de grandeur au-dessus
 * du temps observé sur une machine de développement, là où un coureur
 * d'intégration continue partagé n'est en pratique que trois à cinq fois plus
 * lent. Un test de performance instable finit toujours par être désactivé, et
 * ne protège alors plus rien du tout.
 *
 * Les temps observés au moment de l'écriture sont indiqués dans chaque test.
 */

function fakeIo(): Server {
  return { to: () => ({ emit: () => undefined }) } as unknown as Server;
}

function fakeSocket(id: string): Socket {
  return { id, data: {}, join: () => undefined, leave: () => undefined, emit: () => undefined } as unknown as Socket;
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

/** Compteur d'actions appliquées : englobe les coups des robots. */
function countActions(room: Room): () => number {
  const original = room.apply.bind(room);
  let count = 0;
  room.apply = (action: GameAction) => {
    count++;
    return original(action);
  };
  return () => count;
}

/**
 * Déroule une partie jusqu'à `game-over` : l'humain joue l'option légale la
 * plus simple, les robots jouent seuls via leurs propres minuteurs (délai nul
 * en test). Aucune attente arbitraire : on rend la main à la boucle
 * d'événements et on regarde l'état.
 */
async function playToEnd(room: Room, humanId: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (room.state.phase !== 'game-over') {
    if (Date.now() > deadline) throw new Error(`partie non terminée (phase ${room.state.phase})`);
    const s = room.state;
    if (s.phase === 'round-scoring') {
      room.apply({ type: 'NEXT_ROUND', playerId: s.hostId });
      continue;
    }
    const current = s.players.find((p) => p.seat === s.round!.currentSeat);
    if (current?.id === humanId) {
      if (s.phase === 'bidding') room.apply({ type: 'BID', playerId: humanId, bid: lowestLegalBid(s, humanId) });
      else room.apply({ type: 'PLAY_CARD', playerId: humanId, cardId: lowestLegalCard(s, humanId) });
      continue;
    }
    // C'est à un robot : on laisse tourner la boucle d'événements.
    await tick();
  }
}

/** Table de `botCount` robots menée par un humain, prête à jouer. */
function tableWithBots(botCount: number, humanId = 'humain'): Room {
  const room = new Room(
    fakeIo(),
    'PERF',
    { id: humanId, pseudo: 'Humain', avatar: 'a1' },
    {},
    // Robots instantanés et minuteur de tour désactivé : on mesure le moteur
    // et la diffusion, pas des `setTimeout` d'agrément.
    { botDelayMs: 0, turnSeconds: 0 },
  );
  for (let i = 0; i < botCount; i++) expect(room.addBot().ok).toBe(true);
  room.attach(humanId, fakeSocket('sock-humain'));
  room.apply({ type: 'START_GAME', playerId: humanId });
  return room;
}

describe('partie complète à huit joueurs', () => {
  /*
   * Huit joueurs, c'est la table maximale : onze manches, trente-six plis,
   * près de quatre cents actions, chacune clonant l'état et rediffusant une
   * vue par joueur. C'est le pire cas du moteur, et le premier endroit où une
   * régression algorithmique se verrait.
   *
   * Observé : ~330 ms (dont l'essentiel en tours de boucle d'événements, un
   * par coup de robot). Budget : 5 s. Une machine d'intégration continue
   * partagée tourne couramment 3 à 5 fois moins vite ; il reste alors encore
   * un facteur 3 de marge avant que le test ne devienne instable.
   */
  it(
    'se termine en un temps raisonnable et avec le bon nombre d’actions',
    async () => {
      const room = tableWithBots(7);
      const actions = countActions(room);

      const started = Date.now();
      await playToEnd(room, 'humain', 20_000);
      const elapsed = Date.now() - started;

      const seq = room.state.roundsSequence;
      const players = room.state.players.length;
      expect(players).toBe(8);
      // 8 joueurs → 6 cartes max → 1..6..1 = 11 manches, 36 plis.
      expect(seq).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);

      // Annonces + cartes + relances de manche : rien de superflu, rien qui
      // manque. Un écart signalerait un coup rejoué ou une action fantôme.
      const bids = seq.length * players;
      const cards = seq.reduce((a, b) => a + b, 0) * players;
      // Une relance par manche, la dernière servant à clore la partie.
      const nextRounds = seq.length;
      expect(actions()).toBe(bids + cards + nextRounds);

      expect(room.state.phase).toBe('game-over');
      expect(room.state.players.every((p) => Number.isInteger(p.totalScore))).toBe(true);
      console.log(`[perf] partie 8 joueurs : ${elapsed} ms, ${actions()} actions`);
      expect(elapsed).toBeLessThan(5_000);

      room.close('fin de test');
    },
    30_000,
  );
});

describe('parties simultanées', () => {
  /*
   * Vingt tables menées de front, entrelacées sur la même boucle d'événements.
   * Le garde-fou porte sur le coût par action : si une table coûte cher, vingt
   * tables coûtent vingt fois plus, et une régression quadratique (par exemple
   * une diffusion qui reprojette tout l'état pour chaque joueur de chaque
   * room) explose ici bien avant d'être visible sur une table seule.
   *
   * Observé : ~500 ms pour 20 parties complètes à 3 joueurs (7 520 actions).
   * Budget : 8 s, soit un facteur 16 — la même marge que ci-dessus, appliquée
   * à une mesure qui dépend davantage de la charge de la machine.
   */
  it(
    'mène vingt parties de front sans explosion du temps total',
    async () => {
      const ROOMS = 20;
      const rooms = Array.from({ length: ROOMS }, (_, i) => tableWithBots(2, `humain-${i}`));
      const counters = rooms.map((r) => countActions(r));

      const started = Date.now();
      await Promise.all(rooms.map((room, i) => playToEnd(room, `humain-${i}`, 60_000)));
      const elapsed = Date.now() - started;

      const total = counters.reduce((sum, c) => sum + c(), 0);
      for (const room of rooms) {
        expect(room.state.phase).toBe('game-over');
        expect(room.state.players).toHaveLength(3);
      }
      console.log(`[perf] ${ROOMS} parties simultanées : ${elapsed} ms, ${total} actions`);
      expect(total).toBeGreaterThan(ROOMS * 300);
      expect(elapsed).toBeLessThan(8_000);

      for (const room of rooms) room.close('fin de test');
    },
    60_000,
  );
});

describe('empreinte mémoire', () => {
  /*
   * Deux cents parties créées puis fermées. Une room retient un état complet,
   * des sockets et jusqu'à trois familles de minuteurs : si `close()` n'en
   * libère pas une, les rooms mortes s'accumulent et le serveur finit par
   * tomber au bout de quelques jours — sans erreur, ce qui rend le diagnostic
   * très pénible.
   *
   * Observé : ~6 Mo. Le seuil (32 Mo) est très large : sans `--expose-gc`,
   * `heapUsed` mesure
   * autant les déchets pas encore collectés que la vraie rétention. Ce qu'on
   * cherche ici, c'est une fuite franche (des dizaines de Mo), pas un octet.
   */
  it('ne retient pas la mémoire de 200 parties fermées', () => {
    const manager = new RoomManager(fakeIo(), undefined, { botDelayMs: 0, turnSeconds: 0 });

    // Tour de chauffe : la première partie alloue les structures du moteur.
    for (let i = 0; i < 10; i++) {
      const warm = manager.create({ id: 'chauffe', pseudo: 'Chauffe', avatar: 'a1' });
      manager.remove(warm.code, 'test');
    }
    global.gc?.();
    const before = process.memoryUsage().heapUsed;

    for (let i = 0; i < 200; i++) {
      const room = manager.create({ id: `hote-${i}`, pseudo: 'Hote', avatar: 'a1' });
      room.addBot();
      room.addBot();
      const socket = fakeSocket(`sock-${i}`);
      room.attach(`hote-${i}`, socket);
      room.apply({ type: 'START_GAME', playerId: `hote-${i}` });
      room.detach(`hote-${i}`, socket);
      manager.remove(room.code, 'test');
    }

    global.gc?.();
    const after = process.memoryUsage().heapUsed;
    const grownMb = (after - before) / 1024 / 1024;
    console.log(`[perf] 200 rooms créées puis fermées : ${grownMb.toFixed(1)} Mo de tas en plus`);

    expect(grownMb).toBeLessThan(32);
    manager.stop();
  });
});

/* ------------------------------------------------------------------ */
/* Temps de réponse, mesuré à travers un vrai socket                    */
/* ------------------------------------------------------------------ */

let server: ReturnType<typeof createApp>;
let baseUrl: string;

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

describe('temps de réponse d’une action', () => {
  let host: TestClient;

  beforeAll(async () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      DB_PATH: ':memory:',
      JWT_SECRET: 'secret-de-test-performance',
      PORT: '0',
      BOT_DELAY_MS: '0',
    } as NodeJS.ProcessEnv);
    server = createApp(config);
    await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    host?.socket?.close();
    server.rooms.stop();
    server.io.close();
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
    server.db.close();
  });

  /*
   * Ce que ressent le joueur : le délai entre le doigt sur la carte et la
   * table qui bouge. Tout s'y accumule — parcours du socket, moteur,
   * projection de la vue, retour réseau. Sur une boucle locale c'est de
   * l'ordre de la milliseconde (médiane observée : 1 ms, pire cas 2 ms) ; le
   * seuil à 400 ms laisse la place à une
   * machine chargée tout en attrapant une vraie régression (une écriture
   * synchrone en base par action, par exemple, se verrait immédiatement).
   */
  it(
    'répond à chaque annonce et à chaque carte sous le seuil',
    async () => {
      host = await createUser('PerfHote');
      await host.connect();
      const created = await host.emit<{ ok: boolean; code: string }>('room:create');
      expect((await host.emit('room:addBot')).ok).toBe(true);
      expect((await host.emit('room:addBot')).ok).toBe(true);
      await host.waitView((v) => v.players.length === 3, 'table complète');
      expect((await host.emit('game:start')).ok).toBe(true);
      await host.waitView((v) => v.phase === 'bidding', 'annonces');

      const latencies: number[] = [];
      const deadline = Date.now() + 30_000;
      // Une trentaine d'échantillons suffit : au-delà on mesure surtout les
      // robots qui jouent entre nos coups.
      while (latencies.length < 30 && Date.now() < deadline) {
        const view = host.view!;
        if (view.phase === 'game-over') break;
        if (view.phase === 'round-scoring') {
          await host.emit('game:nextRound');
          await host.waitView((v) => v.phase !== 'round-scoring', 'manche suivante');
          continue;
        }
        const mine = await host.waitView(
          (v) => v.round?.legalBids != null || v.round?.legalCardIds != null || v.phase !== view.phase,
          'mon tour',
          10_000,
        );
        if (!mine.round?.legalBids && !mine.round?.legalCardIds) continue;

        const seen = host.views.length;
        const started = Date.now();
        if (mine.round.legalBids) await host.emit('game:bid', { bid: mine.round.legalBids[0] });
        else await host.emit('game:playCard', { cardId: mine.round.legalCardIds![0] });
        // La vue qui suit l'action, pas seulement l'accusé de réception : ce
        // qui compte est le moment où le joueur voit son coup à l'écran.
        await host.waitView(() => host.views.length > seen, 'vue mise à jour');
        latencies.push(Date.now() - started);
      }

      expect(latencies.length).toBeGreaterThanOrEqual(10);
      const max = Math.max(...latencies);
      const median = [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length / 2)];
      console.log(`[perf] ${latencies.length} actions : médiane ${median} ms, pire cas ${max} ms`);

      expect(median).toBeLessThan(150);
      expect(max).toBeLessThan(400);
    },
    60_000,
  );
});
