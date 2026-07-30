import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';

/**
 * `PUT /me/photo` et `POST /report` (server/src/auth/routes.ts).
 *
 * Exigées par la règle 1.2 de l'App Store dès qu'un joueur peut publier un
 * contenu visible par d'autres (ici sa photo de profil) : un moyen de le
 * signaler. Aucun test ne les couvrait jusqu'ici, alors qu'elles manipulent
 * du contenu utilisateur arbitraire — exactement l'endroit où une régression
 * de validation (taille, préfixe MIME) passe inaperçue le plus longtemps.
 */

let server: ReturnType<typeof createApp>;
let baseUrl: string;

/** Vignette JPEG minimale mais valide au sens du schéma (préfixe + base64). */
const VALID_PHOTO = `data:image/jpeg;base64,${'A'.repeat(200)}`;

beforeAll(async () => {
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: ':memory:',
    JWT_SECRET: 'secret-de-test-profil',
  } as NodeJS.ProcessEnv);
  server = createApp(config);
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
});

function put(path: string, body: unknown, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

function post(path: string, body: unknown, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

async function guest(pseudo: string): Promise<{ token: string; id: string }> {
  const res = await post('/api/auth/guest', { pseudo, avatar: '🦊' });
  const data = (await res.json()) as { token: string; user: { id: string } };
  return { token: data.token, id: data.user.id };
}

describe('photo de profil (PUT /me/photo)', () => {
  it('accepte une vignette JPEG valide', async () => {
    const alice = await guest('AlicePhoto');
    const res = await put('/api/me/photo', { photo: VALID_PHOTO }, alice.token);
    expect(res.status).toBe(200);
    const { user } = (await res.json()) as { user: { photo: string | null } };
    expect(user.photo).toBe(VALID_PHOTO);
  });

  it('revient à l’avatar dessiné avec `photo: null`', async () => {
    const alice = await guest('AlicePhotoNull');
    await put('/api/me/photo', { photo: VALID_PHOTO }, alice.token);

    const res = await put('/api/me/photo', { photo: null }, alice.token);
    expect(res.status).toBe(200);
    const { user } = (await res.json()) as { user: { photo: string | null } };
    expect(user.photo).toBeNull();
  });

  /*
   * La vignette arrive déjà réduite par le client (192 px, JPEG) ; le serveur
   * revérifie la taille au cas où un client modifié enverrait n'importe quoi.
   * `photoSchema` plafonne à 90 000 caractères (`server/src/auth/routes.ts`).
   */
  it('refuse une photo trop lourde', async () => {
    const alice = await guest('AlicePhotoLourde');
    const tropLourde = `data:image/jpeg;base64,${'A'.repeat(90_100)}`;
    const res = await put('/api/me/photo', { photo: tropLourde }, alice.token);
    expect(res.status).toBe(400);

    // Et rien n'a été écrit : le profil garde sa valeur précédente.
    const me = await fetch(`${baseUrl}/api/me`, { headers: { Authorization: `Bearer ${alice.token}` } });
    const { user } = (await me.json()) as { user: { photo: string | null } };
    expect(user.photo).toBeNull();
  });

  it('refuse un préfixe MIME invalide (autre chose qu’un JPEG en base64)', async () => {
    const alice = await guest('AlicePhotoMime');
    const cases = [
      'data:image/png;base64,AAAA', // mauvais type MIME
      'data:image/jpeg,AAAA', // pas de base64
      'data:text/plain;base64,AAAA', // pas une image
      'not-a-data-url',
    ];
    for (const photo of cases) {
      const res = await put('/api/me/photo', { photo }, alice.token);
      expect(res.status).toBe(400);
    }
  });

  it('refuse sans session valide', async () => {
    const res = await put('/api/me/photo', { photo: VALID_PHOTO });
    expect(res.status).toBe(401);
  });
});

describe('signalement (POST /report)', () => {
  it('accepte un signalement valide', async () => {
    const alice = await guest('AliceReport');
    const bob = await guest('BobReport');
    const res = await post('/api/report', { playerId: bob.id, reason: 'photo' }, alice.token);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);

    const rows = server.db
      .prepare('SELECT COUNT(*) AS n FROM content_reports WHERE reporter_id = ? AND reported_id = ?')
      .get(alice.id, bob.id) as { n: number };
    expect(rows.n).toBe(1);
  });

  /*
   * Un joueur peut signaler la même personne plusieurs fois (photo changée
   * entre-temps, ou deuxième motif) : rien n'empêche ni ne fusionne les
   * signalements côté serveur (`content_reports` n'a pas de contrainte
   * d'unicité), c'est la relecture humaine qui fait le tri.
   */
  it('accepte un double signalement du même joueur', async () => {
    const alice = await guest('AliceReportDouble');
    const bob = await guest('BobReportDouble');
    expect((await post('/api/report', { playerId: bob.id, reason: 'photo' }, alice.token)).status).toBe(200);
    expect((await post('/api/report', { playerId: bob.id, reason: 'pseudo' }, alice.token)).status).toBe(200);

    const rows = server.db
      .prepare('SELECT COUNT(*) AS n FROM content_reports WHERE reporter_id = ? AND reported_id = ?')
      .get(alice.id, bob.id) as { n: number };
    expect(rows.n).toBe(2);
  });

  it('refuse un motif hors de la liste fermée', async () => {
    const alice = await guest('AliceReportMotif');
    const bob = await guest('BobReportMotif');
    const res = await post('/api/report', { playerId: bob.id, reason: 'insulte' }, alice.token);
    expect(res.status).toBe(400);
  });

  it('refuse de se signaler soi-même', async () => {
    const alice = await guest('AliceReportSoi');
    const res = await post('/api/report', { playerId: alice.id, reason: 'other' }, alice.token);
    expect(res.status).toBe(400);
  });

  it('refuse sans session valide', async () => {
    const res = await post('/api/report', { playerId: 'x', reason: 'other' });
    expect(res.status).toBe(401);
  });
});
