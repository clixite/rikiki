import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Socket } from 'socket.io';
import { lowestLegalBid, lowestLegalCard } from '@rikiki/shared';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';
import type { PushSender, PushSendResult } from '../src/push/sender';

let server: ReturnType<typeof createApp>;
let baseUrl: string;

/** Un envoi capturé par le faux transporteur. */
interface SentPush {
  endpoint: string;
  payload: { title: string; body: string; url: string; tag: string };
}

const sent: SentPush[] = [];
/** Endpoints pour lesquels le transporteur simule un abonnement expiré. */
const goneEndpoints = new Set<string>();

const fakeSender: PushSender = {
  async send(subscription, payload): Promise<PushSendResult> {
    if (goneEndpoints.has(subscription.endpoint)) return { ok: false, statusCode: 410 };
    sent.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload) as SentPush['payload'] });
    return { ok: true };
  },
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function subscription(endpoint: string) {
  return { endpoint, keys: { p256dh: `p256dh-${endpoint.slice(-4)}`, auth: `auth-${endpoint.slice(-4)}` } };
}

async function createGuest(pseudo: string): Promise<{ token: string; id: string }> {
  const res = await fetch(`${baseUrl}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pseudo, avatar: '🦊' }),
  });
  const data = (await res.json()) as { token: string; user: { id: string } };
  return { token: data.token, id: data.user.id };
}

function post(pathname: string, body: unknown, token?: string) {
  return fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

/**
 * Socket minimal : `Room.attach` n'utilise que `id`, `data`, `join`, `leave` et
 * `emit`. Suffisant pour simuler « ce joueur a l'application ouverte ».
 */
function fakeSocket(id: string): Socket {
  return {
    id,
    data: {} as Record<string, unknown>,
    join: () => undefined,
    leave: () => undefined,
    emit: () => true,
  } as unknown as Socket;
}

beforeAll(async () => {
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: ':memory:',
    JWT_SECRET: 'secret-de-test',
    PUBLIC_URL: 'https://rikiki.test',
    BOT_DELAY_MS: '0',
  } as NodeJS.ProcessEnv);
  server = createApp(config, { pushSender: fakeSender });
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
});

describe('API des abonnements push', () => {
  it('expose une clé publique VAPID', async () => {
    const res = await fetch(`${baseUrl}/api/push/public-key`);
    expect(res.status).toBe(200);
    const { publicKey } = (await res.json()) as { publicKey: string };
    expect(typeof publicKey).toBe('string');
    expect(publicKey.length).toBeGreaterThan(20);
  });

  it("abonne puis désabonne un joueur", async () => {
    const user = await createGuest('Abonnée');
    const endpoint = 'https://push.example.com/abc123';

    const before = await fetch(`${baseUrl}/api/push/subscription`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(((await before.json()) as { subscribed: boolean }).subscribed).toBe(false);

    const sub = await post('/api/push/subscribe', subscription(endpoint), user.token);
    expect(sub.status).toBe(200);
    expect(server.push.isSubscribed(user.id)).toBe(true);

    // Idempotent : le même endpoint ne crée pas de doublon
    await post('/api/push/subscribe', subscription(endpoint), user.token);

    const after = await fetch(`${baseUrl}/api/push/subscription`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(((await after.json()) as { subscribed: boolean }).subscribed).toBe(true);

    const unsub = await post('/api/push/unsubscribe', { endpoint }, user.token);
    expect(unsub.status).toBe(200);
    expect(((await unsub.json()) as { subscribed: boolean }).subscribed).toBe(false);
    expect(server.push.isSubscribed(user.id)).toBe(false);
  });

  it('refuse un abonnement sans session ou mal formé', async () => {
    const anonymous = await post('/api/push/subscribe', subscription('https://push.example.com/x'));
    expect(anonymous.status).toBe(401);

    const user = await createGuest('Malformée');
    const bad = await post('/api/push/subscribe', { endpoint: 'pas-une-url' }, user.token);
    expect(bad.status).toBe(400);
  });

  it('supprime un abonnement expiré (410) au premier envoi', async () => {
    const user = await createGuest('Expirée');
    const endpoint = 'https://push.example.com/expire';
    goneEndpoints.add(endpoint);
    server.push.subscribe(user.id, subscription(endpoint));
    expect(server.push.isSubscribed(user.id)).toBe(true);

    const delivered = await server.push.notifyTurn(user.id, { code: 'ZZZZ', phase: 'bidding' });
    expect(delivered).toBe(0);
    expect(server.push.isSubscribed(user.id)).toBe(false);
    goneEndpoints.delete(endpoint);
  });
});

describe('clés VAPID', () => {
  it('reste identique entre deux démarrages sur la même base', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rikiki-vapid-'));
    const dbPath = path.join(dir, 'rikiki.db');
    const config = loadConfig({
      NODE_ENV: 'test',
      DB_PATH: dbPath,
      JWT_SECRET: 'secret-de-test',
      PUBLIC_URL: 'https://rikiki.test',
    } as NodeJS.ProcessEnv);

    const first = createApp(config, { pushSender: fakeSender });
    const firstKey = first.push.publicKey;
    first.rooms.stop();
    first.io.close();
    first.db.close();

    const second = createApp(config, { pushSender: fakeSender });
    const secondKey = second.push.publicKey;
    second.rooms.stop();
    second.io.close();
    second.db.close();

    expect(firstKey).toBe(secondKey);
    expect(firstKey.length).toBeGreaterThan(20);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('privilégie les clés fournies par l’environnement', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      DB_PATH: ':memory:',
      JWT_SECRET: 'secret-de-test',
      VAPID_PUBLIC_KEY: 'cle-publique-de-test',
      VAPID_PRIVATE_KEY: 'cle-privee-de-test',
    } as NodeJS.ProcessEnv);
    const app = createApp(config, { pushSender: fakeSender });
    expect(app.push.publicKey).toBe('cle-publique-de-test');
    app.rooms.stop();
    app.io.close();
    app.db.close();
  });
});

describe('notification « c’est ton tour »', () => {
  it(
    'notifie le joueur déconnecté, jamais le joueur connecté ni un robot',
    async () => {
      // Alice garde l'application ouverte (socket rattaché), Bob a rangé son
      // téléphone (aucun socket), et un robot complète la table.
      const alice = await createGuest('AliceP');
      const bob = await createGuest('BobP');

      const room = server.rooms.create({ id: alice.id, pseudo: 'AliceP', avatar: '🦊' });
      expect(room.apply({ type: 'ADD_PLAYER', player: { id: bob.id, pseudo: 'BobP', avatar: '🐼' } }).ok).toBe(true);
      const bot = room.addBot();
      expect(bot.ok).toBe(true);
      const botId = bot.ok ? bot.player.id : '';

      // Le robot reçoit lui aussi un abonnement : si une notification lui était
      // destinée, le faux transporteur la capterait. Sa ligne `users` est créée
      // à la main (les robots n'ont pas de compte).
      server.db
        .prepare('INSERT INTO users (id, pseudo, avatar, is_guest, created_at) VALUES (?, ?, ?, 1, ?)')
        .run(botId, 'Robot', '🤖', Date.now());

      const aliceEndpoint = 'https://push.example.com/alice';
      const bobEndpoint = 'https://push.example.com/bob';
      const botEndpoint = 'https://push.example.com/bot';
      server.push.subscribe(alice.id, subscription(aliceEndpoint));
      server.push.subscribe(bob.id, subscription(bobEndpoint));
      server.push.subscribe(botId, subscription(botEndpoint));

      sent.length = 0;
      room.attach(alice.id, fakeSocket('socket-alice'));
      // Format court : la partie tient en quelques manches.
      room.apply({ type: 'SET_FORMAT', playerId: alice.id, format: 'blitz' });
      expect(room.apply({ type: 'START_GAME', playerId: alice.id }).ok).toBe(true);

      // Les deux humains jouent (l'option légale la plus simple) ; seul Bob est
      // « absent » au sens des sockets, donc seul Bob doit être notifié.
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline && room.state.phase !== 'game-over') {
        const s = room.state;
        if (s.phase === 'round-scoring') {
          room.apply({ type: 'NEXT_ROUND', playerId: alice.id });
          continue;
        }
        if ((s.phase === 'bidding' || s.phase === 'playing') && s.round) {
          const current = s.players.find((p) => p.seat === s.round!.currentSeat);
          if (current && (current.id === alice.id || current.id === bob.id)) {
            if (s.phase === 'bidding') {
              room.apply({ type: 'BID', playerId: current.id, bid: lowestLegalBid(s, current.id) });
            } else {
              room.apply({ type: 'PLAY_CARD', playerId: current.id, cardId: lowestLegalCard(s, current.id) });
            }
            continue;
          }
        }
        // Laisse le robot jouer (son action passe par un setTimeout).
        await sleep(2);
      }
      expect(room.state.phase).toBe('game-over');

      const endpoints = sent.map((s) => s.endpoint);
      expect(endpoints).toContain(bobEndpoint);
      expect(endpoints).not.toContain(aliceEndpoint);
      expect(endpoints).not.toContain(botEndpoint);

      // Contenu en français, icône groupée par partie
      const first = sent.find((s) => s.endpoint === bobEndpoint)!;
      expect(first.payload.title).toContain('À toi de jouer');
      expect(first.payload.body).toContain(room.code);
      expect(first.payload.tag).toBe(`rikiki-turn-${room.code}`);
      // L'avis mène à CETTE partie : en asynchrone, on en a plusieurs en cours.
      expect(first.payload.url).toBe(`/j/${room.code}`);
      // Les deux phases produisent un message adapté au fil de la partie.
      const bodies = sent.filter((s) => s.endpoint === bobEndpoint).map((s) => s.payload.body);
      expect(bodies.some((b) => b.includes('annonce'))).toBe(true);
      expect(bodies.some((b) => b.includes('carte'))).toBe(true);

      server.rooms.remove(room.code, 'test');
    },
    40_000,
  );

  it('cesse de notifier dès que le joueur revient sur la partie', async () => {
    const carol = await createGuest('CarolP');
    const dave = await createGuest('DaveP');
    const carolEndpoint = 'https://push.example.com/carol';
    server.push.subscribe(carol.id, subscription(carolEndpoint));

    const room = server.rooms.create({ id: carol.id, pseudo: 'CarolP', avatar: '🦊' });
    room.apply({ type: 'ADD_PLAYER', player: { id: dave.id, pseudo: 'DaveP', avatar: '🐼' } });
    room.addBot();
    room.attach(dave.id, fakeSocket('socket-dave'));
    room.attach(carol.id, fakeSocket('socket-carol'));

    sent.length = 0;
    room.apply({ type: 'START_GAME', playerId: carol.id });
    // Laisse le robot avancer : personne n'est déconnecté, donc aucun envoi.
    await sleep(60);
    expect(sent.filter((s) => s.endpoint === carolEndpoint)).toHaveLength(0);

    server.rooms.remove(room.code, 'test');
  });
});
