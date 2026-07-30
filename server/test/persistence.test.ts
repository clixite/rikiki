import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioc, type Socket } from 'socket.io-client';
import type { Card, GameView } from '@rikiki/shared';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';

/**
 * Résistance au redémarrage du serveur : les parties en cours sont écrites
 * dans `live_rooms` et rechargées au démarrage suivant. On simule le
 * redémarrage en recréant un `createApp` sur le MÊME fichier de base.
 */

type App = ReturnType<typeof createApp>;

let tmpDir: string;
let dbPath: string;
let server: App;
let running = false;
let baseUrl: string;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class TestClient {
  socket!: Socket;
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

  waitView(pred: (v: GameView) => boolean, label = 'view', timeoutMs = 4000): Promise<GameView> {
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
    JWT_SECRET: 'secret-de-test-persistance',
    PORT: '0',
    BOT_DELAY_MS: '0',
  } as NodeJS.ProcessEnv);
  server = createApp(config);
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
  running = true;
}

/** Coupe le serveur comme le ferait un SIGTERM (flush, puis fermeture). */
async function stopServer(): Promise<void> {
  if (!running) return;
  running = false;
  server.rooms.flushAll();
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
}

async function waitFor(pred: () => boolean, label: string, timeoutMs = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return;
    await sleep(20);
  }
  throw new Error(`timeout: ${label}`);
}

/** Joue (option légale la plus simple) jusqu'à la fin de la manche en cours. */
async function playUntilRoundScored(clients: TestClient[], timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const phase = clients[0].view?.phase;
    if (phase === 'round-scoring' || phase === 'game-over') return;
    let acted = false;
    for (const c of clients) {
      const round = c.view?.round;
      if (round?.legalBids) {
        await c.emit('game:bid', { bid: round.legalBids[0] }).catch(() => undefined);
        acted = true;
      } else if (round?.legalCardIds) {
        await c.emit('game:playCard', { cardId: round.legalCardIds[0] }).catch(() => undefined);
        acted = true;
      }
    }
    if (!acted) await sleep(10);
  }
  throw new Error(`manche non terminée (phase ${clients[0].view?.phase})`);
}

const liveCodes = () => server.liveRooms.loadAll().map((r) => r.code);

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rikiki-persistance-'));
  dbPath = path.join(tmpDir, 'rikiki.db');
  await startServer();
});

afterAll(async () => {
  await stopServer();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('persistance des parties en cours', () => {
  let alice: TestClient, bob: TestClient;
  let code: string;
  let aliceHand: Card[];
  let botId: string;
  let totalsBefore: Record<string, number>;

  it('écrit en base une partie en cours', async () => {
    alice = await createUser('AlicePersist');
    bob = await createUser('BobPersist');
    await Promise.all([alice.connect(), bob.connect()]);

    const created = await alice.emit<{ ok: boolean; code: string }>('room:create');
    expect(created.ok).toBe(true);
    code = created.code;
    expect((await bob.emit('room:join', { code })).ok).toBe(true);
    const addBot = await alice.emit<{ ok: boolean; playerId: string }>('room:addBot');
    expect(addBot.ok).toBe(true);
    botId = addBot.playerId;
    await alice.waitView((v) => v.players.length === 3, '3 joueurs');

    expect((await alice.emit('game:start')).ok).toBe(true);
    await Promise.all([alice, bob].map((c) => c.waitView((v) => v.phase === 'bidding', 'manche 1')));

    // Manche 1 jouée entièrement, puis manche 2 (2 cartes) : la partie a des
    // scores, une manche en cours et des mains non triviales à conserver.
    await playUntilRoundScored([alice, bob]);
    expect((await alice.emit('game:nextRound')).ok).toBe(true);
    await Promise.all(
      [alice, bob].map((c) => c.waitView((v) => v.phase === 'bidding' && v.round!.cardsCount === 2, 'manche 2')),
    );

    aliceHand = alice.view!.round!.myHand;
    totalsBefore = Object.fromEntries(alice.view!.players.map((p) => [p.id, p.totalScore]));
    expect(aliceHand).toHaveLength(2);

    // L'écriture est groupée (debounce) : on attend qu'elle soit visible.
    // On attend la phase précise, pas seulement la présence de la ligne : la
    // fin de manche qui précède écrit désormais tout de suite (transition
    // critique, voir `Room.apply()`), donc la ligne existe déjà avant que ce
    // débounce-ci — celui de la manche 2 — n'ait eu le temps de la rattraper.
    await waitFor(() => server.liveRooms.loadAll().find((r) => r.code === code)?.state.phase === 'bidding', 'partie écrite en base');
    const row = server.liveRooms.loadAll().find((r) => r.code === code)!;
    expect(row.state.phase).toBe('bidding');
    expect(row.state.hostId).toBe(alice.userId);
    expect(row.state.players).toHaveLength(3);
    expect(row.state.round!.roundIndex).toBe(1);
    expect(row.state.round!.hands[alice.userId]).toEqual(aliceHand);
    expect(row.updatedAt).toBeGreaterThan(0);
  });

  it('restaure la partie après un redémarrage, tous les joueurs déconnectés', async () => {
    await stopServer();
    await startServer();

    const room = server.rooms.get(code);
    expect(room).toBeDefined();
    expect(room!.state.hostId).toBe(alice.userId);
    expect(room!.state.round!.hands[alice.userId]).toEqual(aliceHand);
    for (const p of room!.state.players) {
      expect(p.totalScore).toBe(totalsBefore[p.id]);
      // Aucun socket n'a survécu : seuls les bots restent « connectés ».
      expect(p.connected).toBe(p.id === botId);
    }
    expect(room!.connectedCount()).toBe(0);
  });

  it('permet à un joueur de se reconnecter et de retrouver sa main', async () => {
    const alice2 = new TestClient('AlicePersist', alice.token, alice.userId);
    const bob2 = new TestClient('BobPersist', bob.token, bob.userId);
    await Promise.all([alice2.connect(), bob2.connect()]);

    expect((await alice2.emit('room:join', { code })).ok).toBe(true);
    expect((await bob2.emit('room:join', { code })).ok).toBe(true);

    const v = await alice2.waitView((view) => view.phase === 'bidding' && view.round !== null, 'vue restaurée');
    expect(v.you).toBe(alice.userId);
    expect(v.round!.myHand).toEqual(aliceHand);
    expect(v.round!.cardsCount).toBe(2);
    expect(v.hostId).toBe(alice.userId);
    expect(v.players.map((p) => p.totalScore)).toEqual(v.players.map((p) => totalsBefore[p.id]));

    await bob2.waitView((view) => view.round !== null, 'vue de Bob');
    await waitFor(() => server.rooms.get(code)!.connectedCount() === 2, 'deux joueurs reconnectés');

    alice = alice2;
    bob = bob2;
  });

  it('poursuit la partie restaurée jusqu’à la fin de la manche', async () => {
    await playUntilRoundScored([alice, bob]);
    const v = await alice.waitView((view) => view.phase === 'round-scoring', 'manche 2 scorée');
    expect(Object.keys(v.round!.roundScores!)).toHaveLength(3);
    // Les bots ont bien repris la main après la restauration.
    expect(v.round!.bids[botId]).not.toBeNull();
    expect(Object.values(v.round!.tricksWon).reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('supprime de la base une room fermée', async () => {
    const eve = await createUser('EvePersist');
    await eve.connect();
    const created = await eve.emit<{ ok: boolean; code: string }>('room:create');
    const solo = created.code;
    await waitFor(() => liveCodes().includes(solo), 'lobby écrit en base');

    // Dernier humain parti : la room se ferme et sa ligne disparaît.
    expect((await eve.emit('room:leave')).ok).toBe(true);
    expect(server.rooms.get(solo)).toBeUndefined();
    expect(liveCodes()).not.toContain(solo);
    eve.socket.close();
  });

  it('ne restaure pas une partie trop vieille', async () => {
    const stale = { ...server.rooms.get(code)!.state, code: 'ZZZZ' };
    // Une heure d'inactivité : au-delà de tous les TTL du sweep().
    server.liveRooms.save('ZZZZ', stale, Date.now() - 60 * 60_000);
    expect(liveCodes()).toContain('ZZZZ');

    alice.socket.close();
    bob.socket.close();
    await stopServer();
    await startServer();

    expect(server.rooms.get('ZZZZ')).toBeUndefined();
    expect(liveCodes()).not.toContain('ZZZZ');
    // …tandis que la partie récente est toujours là.
    expect(server.rooms.get(code)).toBeDefined();
  });
});

/*
 * P1 — fenêtre de perte de 250 ms sur les transitions critiques.
 *
 * `PERSIST_DEBOUNCE_MS` groupe les écritures : une action est diffusée aux
 * clients immédiatement, mais écrite en base 250 ms plus tard. Sur un crash
 * dur (OOM, `kill -9`) dans cette fenêtre, l'état redémarre en arrière d'une
 * action que le joueur a pourtant vue confirmée à l'écran. C'est
 * particulièrement coûteux à rejouer pour une fin de manche ou une fin de
 * partie — `Room.apply()` force donc un `flush()` synchrone sur ces deux
 * transitions précises, et seulement elles.
 */
describe('écriture immédiate sur les transitions critiques (P1)', () => {
  it('écrit round-scoring et game-over en base sans attendre le débounce', async () => {
    const alice = await createUser('AliceFlushCrit');
    const bob = await createUser('BobFlushCrit');
    await Promise.all([alice.connect(), bob.connect()]);

    const created = await alice.emit<{ ok: boolean; code: string }>('room:create');
    const code = created.code;
    expect((await bob.emit('room:join', { code })).ok).toBe(true);
    expect((await alice.emit('room:addBot')).ok).toBe(true);
    await alice.waitView((v) => v.players.length === 3, '3 joueurs');
    expect((await alice.emit('game:start')).ok).toBe(true);
    await Promise.all([alice, bob].map((c) => c.waitView((v) => v.phase === 'bidding', 'annonces')));

    // Une seule manche d'une carte suffit pour atteindre round-scoring puis,
    // via NEXT_ROUND, game-over — sans jouer toute la partie. On raccourcit
    // la séquence des manches APRÈS le lancement (la manche 1, déjà distribuée
    // à une carte, n'en est pas affectée) : un pur raccourci de préparation du
    // test, aucune action de jeu n'est simulée par ce biais.
    const live = server.rooms.get(code)!;
    live.state = { ...live.state, roundsSequence: [1] };

    await playUntilRoundScored([alice, bob]);

    // Aucune attente : si l'écriture était encore groupée, la base
    // afficherait ici l'ancienne phase (`bidding` ou `playing`) pendant 250 ms.
    const afterRound = server.liveRooms.loadAll().find((r) => r.code === code)!;
    expect(afterRound.state.phase).toBe('round-scoring');

    expect((await alice.emit('game:nextRound')).ok).toBe(true);
    const afterGame = server.liveRooms.loadAll().find((r) => r.code === code)!;
    expect(afterGame.state.phase).toBe('game-over');

    alice.socket.close();
    bob.socket.close();
  });

  it('garde le débounce pour les actions ordinaires (une annonce n’écrit pas au disque à chaque coup)', async () => {
    const alice = await createUser('AliceFlushOrdi');
    const bob = await createUser('BobFlushOrdi');
    await Promise.all([alice.connect(), bob.connect()]);

    const created = await alice.emit<{ ok: boolean; code: string }>('room:create');
    const code = created.code;
    expect((await bob.emit('room:join', { code })).ok).toBe(true);
    expect((await alice.emit('room:addBot')).ok).toBe(true);
    await alice.waitView((v) => v.players.length === 3, '3 joueurs');
    expect((await alice.emit('game:start')).ok).toBe(true);
    await Promise.all([alice, bob].map((c) => c.waitView((v) => v.phase === 'bidding', 'annonces')));
    await waitFor(() => liveCodes().includes(code), 'partie écrite en base');

    const view = alice.view!;
    const seat = view.round!.currentSeat;
    const actor = [alice, bob].find((c) => c.userId === view.players.find((p) => p.seat === seat)!.id) ?? alice;
    const bid = actor.view!.round!.legalBids![0];
    expect((await actor.emit('game:bid', { bid })).ok).toBe(true);

    // Juste après l'annonce : l'écriture est groupée, la base n'a pas encore
    // bougé. Écrire à chaque carte jouée serait le sur-coût que le débounce
    // évite précisément.
    const immediate = server.liveRooms.loadAll().find((r) => r.code === code)!;
    expect(immediate.state.round!.bids[actor.userId]).toBeNull();

    await waitFor(
      () => server.liveRooms.loadAll().find((r) => r.code === code)!.state.round!.bids[actor.userId] !== null,
      'annonce écrite après le débounce',
    );

    alice.socket.close();
    bob.socket.close();
  });
});
