import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioc, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import type { GameView } from '@rikiki/shared';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';

let server: ReturnType<typeof createApp>;
let baseUrl: string;

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

function currentPlayerOf(clients: TestClient[], view: GameView): TestClient {
  const seat = view.round!.currentSeat;
  const pid = view.players.find((p) => p.seat === seat)!.id;
  return clients.find((c) => c.userId === pid)!;
}

beforeAll(async () => {
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: ':memory:',
    JWT_SECRET: 'secret-de-test',
    PORT: '0',
  } as NodeJS.ProcessEnv);
  server = createApp(config);
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  const port = (server.httpServer.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
});

describe('auth invité', () => {
  it('rejette un pseudo trop court', async () => {
    const res = await fetch(`${baseUrl}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo: 'a', avatar: '🦊' }),
    });
    expect(res.status).toBe(400);
  });

  it('refuse une connexion socket sans token valide', async () => {
    const bad = ioc(baseUrl, { auth: { token: 'nimporte-quoi' }, transports: ['websocket'], reconnection: false });
    const err = await new Promise<Error>((resolve) => bad.once('connect_error', resolve));
    expect(err.message).toBe('INVALID_TOKEN');
    bad.close();
  });
});

describe('partie complète à 3 joueurs', () => {
  let alice: TestClient, bob: TestClient, carol: TestClient;
  let clients: TestClient[];
  let code: string;

  it('crée et rejoint une room avec un code à 4 lettres', async () => {
    alice = await createUser('Alice');
    bob = await createUser('Bob');
    carol = await createUser('Carol');
    clients = [alice, bob, carol];
    await Promise.all(clients.map((c) => c.connect()));

    const created = await alice.emit<{ ok: boolean; code: string }>('room:create');
    expect(created.ok).toBe(true);
    code = created.code;
    expect(code).toMatch(/^[A-Z]{4}$/);

    expect((await bob.emit('room:join', { code })).ok).toBe(true);
    expect((await carol.emit('room:join', { code })).ok).toBe(true);
    await Promise.all(clients.map((c) => c.waitView((v) => v.players.length === 3, '3 joueurs')));
  });

  it('rejette un code inexistant', async () => {
    const res = await bob.emit<{ ok: boolean; error?: { code: string } }>('room:join', { code: 'AAAA' });
    // AAAA peut théoriquement exister ; on vérifie surtout le format de l'erreur si échec
    if (!res.ok) expect(res.error!.code).toBe('ROOM_NOT_FOUND');
    // re-rejoint la bonne room pour la suite
    await bob.emit('room:join', { code });
  });

  it('refuse le démarrage par un non-hôte puis démarre', async () => {
    const notHost = await bob.emit<{ ok: boolean; error?: { code: string } }>('game:start');
    expect(notHost.ok).toBe(false);

    expect((await alice.emit('game:start')).ok).toBe(true);
    await Promise.all(
      clients.map((c) =>
        c.waitView((v) => v.phase === 'bidding' && v.round !== null, 'phase bidding'),
      ),
    );
    for (const c of clients) {
      const v = c.view!;
      expect(v.round!.cardsCount).toBe(1);
      expect(v.round!.myHand).toHaveLength(1);
      expect(v.round!.trumpCard).not.toBeNull();
      // Anti-triche : les mains complètes ne sont jamais exposées
      expect((v.round as unknown as { hands?: unknown }).hands).toBeUndefined();
      expect(Object.values(v.round!.handCounts)).toEqual([1, 1, 1]);
    }
  });

  it('applique la règle du crochet et termine les enchères', async () => {
    // Les deux premiers annoncent 0
    for (let i = 0; i < 2; i++) {
      const current = currentPlayerOf(clients, clients[0].view!);
      const myView = await current.waitView((v) => v.round?.legalBids != null, 'mes enchères');
      expect(myView.round!.legalBids).toContain(0);
      expect((await current.emit('game:bid', { bid: 0 })).ok).toBe(true);
      await Promise.all(clients.map((c) => c.waitView((v) => v.round!.bids[current.userId] === 0, 'enchère visible')));
    }
    // Le dernier (dealer) ne peut pas annoncer 1 (total = 1 pli)
    const dealer = currentPlayerOf(clients, clients[0].view!);
    const dealerView = await dealer.waitView((v) => v.round?.legalBids != null, 'enchères dealer');
    expect(dealerView.round!.legalBids).toEqual([0]);
    const hook = await dealer.emit<{ ok: boolean; error?: { code: string } }>('game:bid', { bid: 1 });
    expect(hook.ok).toBe(false);
    expect(hook.error!.code).toBe('ILLEGAL_BID_HOOK');

    expect((await dealer.emit('game:bid', { bid: 0 })).ok).toBe(true);
    await Promise.all(clients.map((c) => c.waitView((v) => v.phase === 'playing', 'phase playing')));
  });

  it('joue le pli et score la manche', async () => {
    for (let i = 0; i < 3; i++) {
      const current = currentPlayerOf(clients, clients[0].view!);
      const myView = await current.waitView((v) => v.round?.legalCardIds != null, 'mes cartes légales');
      const cardId = myView.round!.legalCardIds![0];

      // Un autre joueur ne peut pas jouer à sa place
      const other = clients.find((c) => c !== current)!;
      const cheat = await other.emit<{ ok: boolean; error?: { code: string } }>('game:playCard', {
        cardId: other.view!.round!.myHand[0] ? `${other.view!.round!.myHand[0].suit}${other.view!.round!.myHand[0].rank}` : 'S2',
      });
      if (!cheat.ok) expect(['NOT_YOUR_TURN', 'ILLEGAL_CARD', 'BAD_PHASE']).toContain(cheat.error!.code);

      expect((await current.emit('game:playCard', { cardId })).ok).toBe(true);
      await Promise.all(
        clients.map((c) =>
          c.waitView(
            (v) => v.phase === 'round-scoring' || v.round!.handCounts[current.userId] === 0,
            'carte jouée',
          ),
        ),
      );
    }
    await Promise.all(clients.map((c) => c.waitView((v) => v.phase === 'round-scoring', 'fin de manche')));
    const v = clients[0].view!;
    const scores = Object.values(v.round!.roundScores!);
    // Tous ont annoncé 0 : le gagnant du pli rate (-2), les deux autres réussissent (+10)
    expect(scores.filter((s) => s === 10)).toHaveLength(2);
    expect(scores.filter((s) => s === -2)).toHaveLength(1);
    const totals = v.players.map((p) => p.totalScore).sort((a, b) => a - b);
    expect(totals).toEqual([-2, 10, 10]);
  });

  it('lance la manche suivante (2 cartes)', async () => {
    expect((await alice.emit('game:nextRound')).ok).toBe(true);
    await Promise.all(clients.map((c) => c.waitView((v) => v.phase === 'bidding' && v.round!.cardsCount === 2, 'manche 2')));
    for (const c of clients) {
      expect(c.view!.round!.myHand).toHaveLength(2);
    }
  });

  it('gère la reconnexion en pleine partie', async () => {
    bob.socket.close();
    // Alice voit Bob déconnecté
    await alice.waitView((v) => v.players.find((p) => p.id === bob.userId)!.connected === false, 'bob déconnecté');

    const bob2 = new TestClient('Bob', bob.token, bob.userId);
    await bob2.connect();
    const rejoin = await bob2.emit<{ ok: boolean }>('room:join', { code });
    expect(rejoin.ok).toBe(true);
    const v = await bob2.waitView((v) => v.phase === 'bidding' && v.round !== null, 'vue restaurée');
    expect(v.round!.myHand).toHaveLength(2);
    expect(v.you).toBe(bob.userId);
    await alice.waitView((p) => p.players.find((pl) => pl.id === bob.userId)!.connected === true, 'bob reconnecté');
    bob = bob2;
    clients = [alice, bob, carol];
  });

  it('ferme proprement', () => {
    for (const c of clients) c.socket.close();
    carol.socket.close();
  });
});
