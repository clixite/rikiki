import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';
import type { Mailer } from '../src/mail/mailer';

let server: ReturnType<typeof createApp>;
let baseUrl: string;
const sentLinks: { email: string; url: string }[] = [];

/** Adresse dont l'envoi échoue toujours : simule une panne SMTP. */
const BROKEN_EMAIL = 'panne@example.fr';
/** Doit rester aligné sur `MAX_ACTIVE_LINKS` du serveur. */
const MAX_ACTIVE_LINKS = 3;

const fakeMailer: Mailer = {
  enabled: true,
  provider: 'smtp',
  sendMagicLink: async (email, url) => {
    if (email === BROKEN_EMAIL) throw new Error('SMTP indisponible');
    sentLinks.push({ email, url });
  },
};

beforeAll(async () => {
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: ':memory:',
    JWT_SECRET: 'secret-de-test',
    PUBLIC_URL: 'https://rikiki.test',
  } as NodeJS.ProcessEnv);
  server = createApp(config, { mailer: fakeMailer });
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
});

function post(path: string, body: unknown, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

describe('magic link', () => {
  it("promeut un invité en compte e-mail (id et profil conservés)", async () => {
    const guestRes = await post('/api/auth/guest', { pseudo: 'Marie', avatar: '🦄' });
    const guest = (await guestRes.json()) as { token: string; user: { id: string } };

    const linkRes = await post('/api/auth/magic-link', { email: 'Marie@Example.FR' }, guest.token);
    expect(linkRes.status).toBe(200);
    expect(sentLinks).toHaveLength(1);
    expect(sentLinks[0].email).toBe('marie@example.fr');
    expect(sentLinks[0].url).toMatch(/^https:\/\/rikiki\.test\/verify\?t=/);

    const t = new URL(sentLinks[0].url).searchParams.get('t')!;
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify?t=${t}`);
    expect(verifyRes.status).toBe(200);
    const verified = (await verifyRes.json()) as { token: string; user: { id: string; email: string; isGuest: boolean; pseudo: string } };
    expect(verified.user.id).toBe(guest.user.id);
    expect(verified.user.email).toBe('marie@example.fr');
    expect(verified.user.isGuest).toBe(false);
    expect(verified.user.pseudo).toBe('Marie');
  });

  it('refuse la réutilisation du lien', async () => {
    const t = new URL(sentLinks[0].url).searchParams.get('t')!;
    const again = await fetch(`${baseUrl}/api/auth/verify?t=${t}`);
    expect(again.status).toBe(400);
  });

  it('reconnecte un compte e-mail existant depuis un autre appareil', async () => {
    // Demande sans être connecté (nouvel appareil)
    const linkRes = await post('/api/auth/magic-link', { email: 'marie@example.fr' });
    expect(linkRes.status).toBe(200);
    const t = new URL(sentLinks.at(-1)!.url).searchParams.get('t')!;
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify?t=${t}`);
    const verified = (await verifyRes.json()) as { user: { pseudo: string; email: string } };
    expect(verified.user.pseudo).toBe('Marie');
  });

  it('crée un compte neuf pour un e-mail inconnu sans session', async () => {
    await post('/api/auth/magic-link', { email: 'paul@example.fr' });
    const t = new URL(sentLinks.at(-1)!.url).searchParams.get('t')!;
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify?t=${t}`);
    const verified = (await verifyRes.json()) as { user: { pseudo: string; isGuest: boolean } };
    expect(verified.user.isGuest).toBe(false);
    expect(verified.user.pseudo).toBe('paul');
  });

  it('limite le nombre de liens actifs par e-mail', async () => {
    for (let i = 0; i < 3; i++) {
      await post('/api/auth/magic-link', { email: 'spam@example.fr' });
    }
    const res = await post('/api/auth/magic-link', { email: 'spam@example.fr' });
    expect(res.status).toBe(429);
  });

  it("n'impute pas le quota quand l'envoi échoue", async () => {
    // Une panne SMTP ne doit pas verrouiller l'adresse : sans nettoyage, les
    // liens jamais partis compteraient dans le quota pendant 15 minutes.
    for (let i = 0; i < MAX_ACTIVE_LINKS + 1; i++) {
      const res = await post('/api/auth/magic-link', { email: BROKEN_EMAIL });
      expect(res.status).toBe(502);
    }
    const active = server.db
      .prepare('SELECT COUNT(*) AS n FROM magic_links WHERE email = ?')
      .get(BROKEN_EMAIL) as { n: number };
    expect(active.n).toBe(0);
  });

  it('rejette un e-mail invalide', async () => {
    const res = await post('/api/auth/magic-link', { email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });
});

describe('historique des parties', () => {
  it("est vide pour un nouveau joueur puis se remplit", async () => {
    const guestRes = await post('/api/auth/guest', { pseudo: 'Historien', avatar: '🦉' });
    const guest = (await guestRes.json()) as { token: string; user: { id: string } };

    const empty = await fetch(`${baseUrl}/api/me/history`, {
      headers: { Authorization: `Bearer ${guest.token}` },
    });
    expect(empty.status).toBe(200);
    expect(((await empty.json()) as { games: unknown[] }).games).toEqual([]);

    // Simule une partie terminée enregistrée par le serveur
    server.users.addHistoryEntry({
      userId: guest.user.id,
      code: 'ABCD',
      playedAt: 1_700_000_000_000,
      playersCount: 3,
      myScore: 42,
      myRank: 1,
      won: true,
      standings: [
        { pseudo: 'Historien', avatar: '🦉', score: 42 },
        { pseudo: 'Ada', avatar: '🤖', score: 30 },
      ],
    });

    const filled = await fetch(`${baseUrl}/api/me/history`, {
      headers: { Authorization: `Bearer ${guest.token}` },
    });
    const { games } = (await filled.json()) as {
      games: { code: string; myScore: number; won: boolean; standings: unknown[] }[];
    };
    expect(games).toHaveLength(1);
    expect(games[0].code).toBe('ABCD');
    expect(games[0].myScore).toBe(42);
    expect(games[0].won).toBe(true);
    expect(games[0].standings).toHaveLength(2);
  });

  it('refuse un historique sans session valide', async () => {
    const res = await fetch(`${baseUrl}/api/me/history`);
    expect(res.status).toBe(401);
  });
});

describe('suppression de compte', () => {
  it('efface le compte et tout ce qui en dépend', async () => {
    const guestRes = await post('/api/auth/guest', { pseudo: 'Éphémère', avatar: 'a2' });
    const guest = (await guestRes.json()) as { token: string; user: { id: string } };
    const auth = { Authorization: `Bearer ${guest.token}` };

    server.users.addHistoryEntry({
      userId: guest.user.id,
      code: 'ZZZZ',
      playedAt: 1_700_000_000_000,
      playersCount: 3,
      myScore: 10,
      myRank: 2,
      won: false,
      standings: [{ pseudo: 'Éphémère', avatar: 'a2', score: 10 }],
    });

    const del = await fetch(`${baseUrl}/api/me`, { method: 'DELETE', headers: auth });
    expect(del.status).toBe(200);

    // Le jeton reste cryptographiquement valide : c'est l'absence du compte
    // qui doit fermer la porte.
    const me = await fetch(`${baseUrl}/api/me`, { headers: auth });
    expect(me.status).toBe(401);

    expect(server.users.getById(guest.user.id)).toBeNull();
    const rows = server.db
      .prepare('SELECT COUNT(*) AS n FROM game_history WHERE user_id = ?')
      .get(guest.user.id) as { n: number };
    expect(rows.n).toBe(0);
    const stats = server.db
      .prepare('SELECT COUNT(*) AS n FROM stats WHERE user_id = ?')
      .get(guest.user.id) as { n: number };
    expect(stats.n).toBe(0);
  });

  it('invalide les liens de connexion en attente du compte supprimé', async () => {
    const guestRes = await post('/api/auth/guest', { pseudo: 'Passager', avatar: 'a4' });
    const guest = (await guestRes.json()) as { token: string; user: { id: string } };

    await post('/api/auth/magic-link', { email: 'passager@example.fr' }, guest.token);
    const link = new URL(sentLinks.at(-1)!.url).searchParams.get('t')!;

    await fetch(`${baseUrl}/api/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${guest.token}` },
    });

    // Sans nettoyage, ce lien rouvrirait une session sur un compte effacé
    const verify = await fetch(`${baseUrl}/api/auth/verify?t=${link}`);
    expect(verify.status).toBe(400);
  });

  it('refuse la suppression sans session valide', async () => {
    const res = await fetch(`${baseUrl}/api/me`, { method: 'DELETE' });
    expect(res.status).toBe(401);
  });
});
