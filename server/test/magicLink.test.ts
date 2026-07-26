import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';
import type { Mailer } from '../src/mail/mailer';

let server: ReturnType<typeof createApp>;
let baseUrl: string;
const sentLinks: { email: string; url: string }[] = [];

const fakeMailer: Mailer = {
  enabled: true,
  sendMagicLink: async (email, url) => {
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

  it('rejette un e-mail invalide', async () => {
    const res = await post('/api/auth/magic-link', { email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });
});
