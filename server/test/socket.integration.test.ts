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
    // Les bots jouent instantanément en test (sinon ~350 actions × 1 s).
    BOT_DELAY_MS: '0',
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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Joue le rôle de l'humain (option légale la plus simple) jusqu'à `game-over`,
 * les bots jouant tout seuls entre-temps.
 */
async function playUntilGameOver(c: TestClient, timeoutMs = 60_000): Promise<GameView> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const v = c.view!;
    if (v.phase === 'game-over') return v;
    if (v.phase === 'round-scoring') {
      await c.emit('game:nextRound').catch(() => undefined);
    } else if (v.round?.legalBids) {
      await c.emit('game:bid', { bid: v.round.legalBids[0] }).catch(() => undefined);
    } else if (v.round?.legalCardIds) {
      await c.emit('game:playCard', { cardId: v.round.legalCardIds[0] }).catch(() => undefined);
    } else {
      await sleep(5);
    }
  }
  throw new Error(`partie non terminée (phase ${c.view?.phase})`);
}

describe('joueurs automatiques', () => {
  let alice: TestClient, dave: TestClient;
  let code: string;

  it('refuse l’ajout d’un bot par un non-hôte', async () => {
    alice = await createUser('AliceBot');
    dave = await createUser('DaveBot');
    await Promise.all([alice.connect(), dave.connect()]);

    const created = await alice.emit<{ ok: boolean; code: string }>('room:create');
    code = created.code;
    expect((await dave.emit('room:join', { code })).ok).toBe(true);

    const res = await dave.emit<{ ok: boolean; error?: { code: string } }>('room:addBot');
    expect(res.ok).toBe(false);
    expect(res.error!.code).toBe('NOT_HOST');

    expect((await dave.emit('room:leave')).ok).toBe(true);
    await alice.waitView((v) => v.players.length === 1, 'dave parti');
  });

  it('ajoute des bots depuis le lobby', async () => {
    const first = await alice.emit<{ ok: boolean; playerId: string }>('room:addBot');
    expect(first.ok).toBe(true);
    expect(first.playerId.startsWith('bot:')).toBe(true);
    expect((await alice.emit('room:addBot')).ok).toBe(true);
    expect((await alice.emit('room:addBot')).ok).toBe(true);

    const v = await alice.waitView((view) => view.players.length === 4, '1 humain + 3 bots');
    const bots = v.players.filter((p) => p.id.startsWith('bot:'));
    expect(bots).toHaveLength(3);
    // Pseudos distincts, toujours « connectés », et jamais hôte
    expect(new Set(bots.map((b) => b.pseudo)).size).toBe(3);
    expect(bots.every((b) => b.connected)).toBe(true);
    expect(v.hostId).toBe(alice.userId);
  });

  it('retire un bot et refuse de retirer un humain', async () => {
    const botId = alice.view!.players.find((p) => p.id.startsWith('bot:'))!.id;
    expect((await alice.emit('room:removeBot', { playerId: botId })).ok).toBe(true);
    await alice.waitView((v) => v.players.length === 3, 'bot retiré');

    const human = await alice.emit<{ ok: boolean; error?: { code: string } }>('room:removeBot', {
      playerId: alice.userId,
    });
    expect(human.ok).toBe(false);
    expect(human.error!.code).toBe('PLAYER_NOT_FOUND');
  });

  it(
    'joue une partie complète 1 humain + 2 bots jusqu’à game-over',
    async () => {
      expect((await alice.emit('game:start')).ok).toBe(true);
      await alice.waitView((v) => v.phase === 'bidding', 'phase bidding');

      const before = alice.views.length;
      const final = await playUntilGameOver(alice);

      expect(final.phase).toBe('game-over');
      expect(final.players).toHaveLength(3);
      // L'humain a bien reçu un flux de vues tout au long de la partie
      expect(alice.views.length - before).toBeGreaterThan(100);
      for (const p of final.players) {
        expect(Number.isInteger(p.totalScore)).toBe(true);
      }
      // Les bots ont réellement joué : au moins un a remporté des plis sur la partie
      expect(final.players.some((p) => p.id.startsWith('bot:') && p.totalScore !== 0)).toBe(true);
      expect(final.round!.roundIndex).toBe(final.roundsSequence.length - 1);
    },
    60_000,
  );

  it('n’enregistre pas de statistiques pour les bots', () => {
    const bots = alice.view!.players.filter((p) => p.id.startsWith('bot:'));
    expect(bots.length).toBeGreaterThan(0);
    for (const b of bots) {
      expect(server.users.getStats(b.id)).toEqual({ gamesPlayed: 0, gamesWon: 0, totalPoints: 0, bestRound: 0 });
    }
    // L'humain, lui, a bien une partie enregistrée
    expect(server.users.getStats(alice.userId).gamesPlayed).toBe(1);
  });

  it('ferme la room quand il ne resterait plus que des bots', async () => {
    const eve = await createUser('EveBot');
    await eve.connect();
    const created = await eve.emit<{ ok: boolean; code: string }>('room:create');
    expect((await eve.emit('room:addBot')).ok).toBe(true);
    expect((await eve.emit('room:addBot')).ok).toBe(true);
    await eve.waitView((v) => v.players.length === 3, 'lobby avec bots');

    expect(server.rooms.get(created.code)).toBeDefined();
    expect((await eve.emit('room:leave')).ok).toBe(true);
    expect(server.rooms.get(created.code)).toBeUndefined();
    eve.socket.close();
  });

  it('refuse d’ajouter un bot une fois la partie lancée', async () => {
    const res = await alice.emit<{ ok: boolean; error?: { code: string } }>('room:addBot');
    expect(res.ok).toBe(false);
    expect(res.error!.code).toBe('BAD_PHASE');
    alice.socket.close();
    dave.socket.close();
  });
});

describe('format de partie', () => {
  let host: TestClient, guest: TestClient;
  let code: string;

  it('démarre en format normal et le diffuse à tout le salon', async () => {
    host = await createUser('HoteFormat');
    guest = await createUser('InviteFormat');
    await Promise.all([host.connect(), guest.connect()]);

    const created = await host.emit<{ ok: boolean; code: string }>('room:create');
    code = created.code;
    expect((await guest.emit('room:join', { code })).ok).toBe(true);
    await Promise.all([host, guest].map((c) => c.waitView((v) => v.players.length === 2, '2 joueurs')));

    expect(host.view!.format).toBe('normal');
    expect(guest.view!.format).toBe('normal');
  });

  it('refuse un changement de format par un non-hôte', async () => {
    const res = await guest.emit<{ ok: boolean; error?: { code: string } }>('room:setFormat', { format: 'blitz' });
    expect(res.ok).toBe(false);
    expect(res.error!.code).toBe('NOT_HOST');
    expect(host.view!.format).toBe('normal');
  });

  it('refuse un format inconnu', async () => {
    const res = await host.emit<{ ok: boolean; error?: { code: string } }>('room:setFormat', { format: 'turbo' });
    expect(res.ok).toBe(false);
    expect(res.error!.code).toBe('INVALID_PAYLOAD');
    expect(host.view!.format).toBe('normal');
  });

  it('l’hôte choisit Éclair : les autres joueurs le voient avant le lancement', async () => {
    expect((await host.emit('room:setFormat', { format: 'blitz' })).ok).toBe(true);
    await Promise.all([host, guest].map((c) => c.waitView((v) => v.format === 'blitz', 'format éclair diffusé')));
  });

  it(
    'joue une partie Éclair : 9 manches au lieu de 19',
    async () => {
      // L'invité s'éclipse : la table est complétée par des robots qui jouent seuls
      expect((await guest.emit('room:leave')).ok).toBe(true);
      await host.waitView((v) => v.players.length === 1, 'invité parti');
      expect((await host.emit('room:addBot')).ok).toBe(true);
      expect((await host.emit('room:addBot')).ok).toBe(true);
      await host.waitView((v) => v.players.length === 3, 'table complète');

      expect((await host.emit('game:start')).ok).toBe(true);
      const started = await host.waitView((v) => v.phase === 'bidding', 'phase bidding');
      expect(started.format).toBe('blitz');
      expect(started.roundsSequence).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1]);

      // Le format est verrouillé une fois la partie lancée
      const late = await host.emit<{ ok: boolean; error?: { code: string } }>('room:setFormat', { format: 'normal' });
      expect(late.ok).toBe(false);
      expect(late.error!.code).toBe('BAD_PHASE');

      const final = await playUntilGameOver(host);
      expect(final.phase).toBe('game-over');
      expect(final.roundsSequence).toHaveLength(9);
      expect(final.round!.roundIndex).toBe(8);
      // La dernière manche d'un Éclair redescend à 1 carte
      expect(final.round!.cardsCount).toBe(1);

      host.socket.close();
      guest.socket.close();
    },
    60_000,
  );
});

describe('réactions, phrases, pause et réglages (câblage socket)', () => {
  let host: TestClient, guest: TestClient;
  let code: string;

  it('met en place une partie à deux humains et deux bots', async () => {
    host = await createUser('HostWire');
    guest = await createUser('GuestWire');
    await Promise.all([host.connect(), guest.connect()]);
    code = (await host.emit<{ ok: boolean; code: string }>('room:create')).code;
    expect((await guest.emit('room:join', { code })).ok).toBe(true);
    expect((await host.emit('room:addBot')).ok).toBe(true);
    expect((await host.emit('room:addBot')).ok).toBe(true);
    await host.waitView((v) => v.players.length === 4, 'table complète');
  });

  it('rejette un réglage de barème par un non-hôte, accepte de l’hôte', async () => {
    const bad = await guest.emit<{ ok: boolean; error?: { code: string } }>('room:setScoring', {
      scoring: 'gentle',
    });
    expect(bad.ok).toBe(false);
    expect(bad.error!.code).toBe('NOT_HOST');
    expect((await host.emit('room:setScoring', { scoring: 'gentle' })).ok).toBe(true);
    await host.waitView((v) => v.scoring === 'gentle', 'barème doux');
  });

  it('rejette une réaction hors de la liste fermée', async () => {
    const bad = await guest.emit<{ ok: boolean; error?: { code: string } }>('game:emote', {
      emote: 'not-an-emote',
    });
    expect(bad.ok).toBe(false);
    expect(bad.error!.code).toBe('INVALID_PAYLOAD');
  });

  it('diffuse une petite phrase à toute la table', async () => {
    const received = new Promise<{ playerId: string; phrase: string }>((resolve) => {
      host.socket.on('game:event', (e: { type: string; playerId: string; phrase: string }) => {
        if (e.type === 'phrase') resolve(e);
      });
    });
    expect((await guest.emit('game:phrase', { phrase: 'nice' })).ok).toBe(true);
    const evt = await received;
    expect(evt.phrase).toBe('nice');
    expect(evt.playerId).toBe(guest.userId);
  });

  it('rejette une phrase inconnue', async () => {
    const bad = await guest.emit<{ ok: boolean; error?: { code: string } }>('game:phrase', {
      phrase: 'liberté-de-parole',
    });
    expect(bad.ok).toBe(false);
    expect(bad.error!.code).toBe('INVALID_PAYLOAD');
  });

  it('rejette un payload de pause non booléen', async () => {
    const bad = await guest.emit<{ ok: boolean; error?: { code: string } }>('game:pause', {
      paused: 'oui',
    });
    expect(bad.ok).toBe(false);
    expect(bad.error!.code).toBe('INVALID_PAYLOAD');
  });

  it('met un joueur en pause puis le fait revenir', async () => {
    expect((await host.emit('game:start')).ok).toBe(true);
    await host.waitView((v) => v.phase === 'bidding', 'partie lancée');

    expect((await guest.emit('game:pause', { paused: true })).ok).toBe(true);
    await host.waitView(
      (v) => v.players.find((p) => p.id === guest.userId)?.paused === true,
      'invité en pause',
    );

    expect((await guest.emit('game:pause', { paused: false })).ok).toBe(true);
    await host.waitView(
      (v) => v.players.find((p) => p.id === guest.userId)?.paused !== true,
      'invité de retour',
    );

    host.socket.close();
    guest.socket.close();
  });
});

describe('limitation de débit', () => {
  it('coupe un flot de room:join avant qu’il ne balaye les codes', async () => {
    const attacker = await createUser('Bruteforce');
    await attacker.connect();

    // Bien au-delà du seuil (30 / 5 s) : au moins un join doit être refusé
    // sans révéler si le code existe.
    // Codes de format VALIDE (4 lettres de l'alphabet des salons, jamais un
    // vrai salon) : un refus ne peut donc venir que du limiteur, pas du format.
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const codeFor = (i: number) =>
      abc[(i * 7) % abc.length] + abc[(i * 13) % abc.length] + abc[(i * 17) % abc.length] + 'Z';
    const results = await Promise.all(
      Array.from({ length: 60 }, (_, i) =>
        attacker.emit<{ ok: boolean; error?: { code: string } }>('room:join', { code: codeFor(i) }),
      ),
    );
    const refused = results.filter((r) => !r.ok);
    expect(refused.length).toBeGreaterThan(0);
    // Tous les refus renvoient ROOM_NOT_FOUND : le limiteur ne se distingue pas
    // d'un code inexistant, donc ne fuit aucune information exploitable.
    expect(refused.every((r) => r.error!.code === 'ROOM_NOT_FOUND')).toBe(true);

    attacker.socket.close();
  });
});
