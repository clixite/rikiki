import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Group, GroupDetail } from '@rikiki/shared';
import { BOT_ID_PREFIX } from '@rikiki/shared';
import { loadConfig } from '../src/config';
import { createApp } from '../src/app';
import type { Mailer } from '../src/mail/mailer';
import { GROUP_CODE_LENGTH, isValidGroupCodeFormat } from '../src/rooms/roomCodes';

let server: ReturnType<typeof createApp>;
let baseUrl: string;

const silentMailer: Mailer = { enabled: false, sendMagicLink: async () => undefined };

beforeAll(async () => {
  const config = loadConfig({
    NODE_ENV: 'test',
    DB_PATH: ':memory:',
    JWT_SECRET: 'secret-de-test-groupes',
    PUBLIC_URL: 'https://rikiki.test',
  } as NodeJS.ProcessEnv);
  server = createApp(config, { mailer: silentMailer });
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.rooms.stop();
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  server.db.close();
});

function api(path: string, options: { method?: string; body?: unknown; token?: string } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

interface TestUser {
  token: string;
  id: string;
  pseudo: string;
}

async function createUser(pseudo: string, avatar = '🦊'): Promise<TestUser> {
  const res = await api('/api/auth/guest', { method: 'POST', body: { pseudo, avatar } });
  const data = (await res.json()) as { token: string; user: { id: string } };
  return { token: data.token, id: data.user.id, pseudo };
}

async function createGroup(user: TestUser, name: string): Promise<Group> {
  const res = await api('/api/groups', { method: 'POST', body: { name }, token: user.token });
  expect(res.status).toBe(201);
  return ((await res.json()) as { group: Group }).group;
}

async function joinGroup(user: TestUser, code: string): Promise<Response> {
  return api('/api/groups/join', { method: 'POST', body: { code }, token: user.token });
}

async function detail(user: TestUser, groupId: string): Promise<GroupDetail> {
  const res = await api(`/api/groups/${groupId}`, { token: user.token });
  expect(res.status).toBe(200);
  return (await res.json()) as GroupDetail;
}

describe('groupes d’amis — création et adhésion', () => {
  it('crée un groupe avec un code de partage au bon format', async () => {
    const alice = await createUser('Alice');
    const group = await createGroup(alice, 'Les copains du mardi');

    expect(group.name).toBe('Les copains du mardi');
    expect(group.code).toHaveLength(GROUP_CODE_LENGTH);
    expect(isValidGroupCodeFormat(group.code)).toBe(true);
    // Un code de groupe ne doit jamais ressembler à un code de partie (4 lettres)
    expect(group.code).not.toMatch(/^[A-Z]{4}$/);
    // Les lettres ambiguës sont exclues de l'alphabet
    expect(group.code).not.toMatch(/[ILO]/);
    // Le créateur est membre d'office
    expect(group.ownerId).toBe(alice.id);
    expect(group.membersCount).toBe(1);
  });

  it('génère un code différent pour chaque groupe', async () => {
    const bob = await createUser('Bob');
    const codes = new Set<string>();
    for (let i = 0; i < 5; i++) {
      codes.add((await createGroup(bob, `Groupe ${i}`)).code);
    }
    expect(codes.size).toBe(5);
  });

  it('refuse un nom trop court ou trop long', async () => {
    const carl = await createUser('Carl');
    expect((await api('/api/groups', { method: 'POST', body: { name: 'X' }, token: carl.token })).status).toBe(400);
    expect(
      (await api('/api/groups', { method: 'POST', body: { name: 'x'.repeat(31) }, token: carl.token })).status,
    ).toBe(400);
  });

  it('permet de rejoindre un groupe avec son code', async () => {
    const alice = await createUser('Alice2');
    const bob = await createUser('Bob2');
    const group = await createGroup(alice, 'Les habitués');

    const res = await joinGroup(bob, group.code);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { group: Group }).group.membersCount).toBe(2);

    // Le groupe apparaît maintenant dans la liste des deux joueurs
    const mine = (await (await api('/api/groups', { token: bob.token })).json()) as { groups: Group[] };
    expect(mine.groups.map((g) => g.id)).toContain(group.id);
  });

  it('accepte un code saisi en minuscules ou avec des espaces', async () => {
    const alice = await createUser('Alice3');
    const dana = await createUser('Dana');
    const group = await createGroup(alice, 'Le club');

    const res = await joinGroup(dana, `  ${group.code.toLowerCase()} `);
    expect(res.status).toBe(200);
  });

  it('refuse un code de groupe inconnu', async () => {
    const eve = await createUser('Eve');
    const res = await joinGroup(eve, 'ZZZZZZ');
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe('GROUP_NOT_FOUND');
  });

  it('refuse un code au mauvais format', async () => {
    const eve = await createUser('Eve2');
    expect((await joinGroup(eve, 'ABCD')).status).toBe(400);
    expect((await joinGroup(eve, 'ABCDEI')).status).toBe(400);
  });

  it('refuse une double adhésion', async () => {
    const alice = await createUser('Alice4');
    const frank = await createUser('Frank');
    const group = await createGroup(alice, 'Les fidèles');

    expect((await joinGroup(frank, group.code)).status).toBe(200);
    const again = await joinGroup(frank, group.code);
    expect(again.status).toBe(409);
    expect(((await again.json()) as { error: string }).error).toBe('ALREADY_MEMBER');

    // Le propriétaire non plus ne peut pas rejoindre son propre groupe
    expect((await joinGroup(alice, group.code)).status).toBe(409);
    expect((await detail(alice, group.id)).members).toHaveLength(2);
  });
});

describe('groupes d’amis — classement cumulé', () => {
  it('cumule points, parties et victoires sur plusieurs parties', async () => {
    const alice = await createUser('Alix');
    const bob = await createUser('Boris');
    const chloe = await createUser('Chloé');
    const group = await createGroup(alice, 'Les copains du mardi');
    await joinGroup(bob, group.code);
    await joinGroup(chloe, group.code);

    // Partie 1 : Alix gagne
    server.groups.recordGameResults(group.id, 'AAAA', 1_700_000_000_000, [
      { userId: alice.id, score: 50, rank: 1, won: true },
      { userId: bob.id, score: 30, rank: 2, won: false },
      { userId: chloe.id, score: 10, rank: 3, won: false },
    ]);
    // Partie 2 : Boris gagne
    server.groups.recordGameResults(group.id, 'BBBB', 1_700_000_100_000, [
      { userId: bob.id, score: 60, rank: 1, won: true },
      { userId: alice.id, score: 20, rank: 2, won: false },
      { userId: chloe.id, score: 15, rank: 3, won: false },
    ]);

    const { standings, group: fresh, recentGames } = await detail(alice, group.id);

    // Boris : 90 pts (le plus haut total) devant Alix : 70
    expect(standings.map((s) => s.pseudo)).toEqual(['Boris', 'Alix', 'Chloé']);

    const boris = standings.find((s) => s.userId === bob.id)!;
    expect(boris.totalPoints).toBe(90);
    expect(boris.gamesPlayed).toBe(2);
    expect(boris.gamesWon).toBe(1);

    const alix = standings.find((s) => s.userId === alice.id)!;
    expect(alix.totalPoints).toBe(70);
    expect(alix.gamesPlayed).toBe(2);
    expect(alix.gamesWon).toBe(1);

    const chl = standings.find((s) => s.userId === chloe.id)!;
    expect(chl.totalPoints).toBe(25);
    expect(chl.gamesPlayed).toBe(2);
    expect(chl.gamesWon).toBe(0);

    expect(fresh.gamesCount).toBe(2);

    // Dernières parties : la plus récente en tête, avec tous les participants
    expect(recentGames).toHaveLength(2);
    expect(recentGames[0].code).toBe('BBBB');
    expect(recentGames[0].results).toHaveLength(3);
    expect(recentGames[0].results[0].pseudo).toBe('Boris');
    expect(recentGames[0].results[0].won).toBe(true);
  });

  it('affiche un membre sans partie à zéro', async () => {
    const alice = await createUser('Alice5');
    const newbie = await createUser('Nouveau');
    const group = await createGroup(alice, 'Les débutants');
    await joinGroup(newbie, group.code);

    server.groups.recordGameResults(group.id, 'CCCC', 1_700_000_200_000, [
      { userId: alice.id, score: 40, rank: 1, won: true },
    ]);

    const { standings } = await detail(newbie, group.id);
    const zero = standings.find((s) => s.userId === newbie.id)!;
    expect(zero.totalPoints).toBe(0);
    expect(zero.gamesPlayed).toBe(0);
    expect(zero.gamesWon).toBe(0);
  });

  it('exclut les robots et les non-membres du classement', async () => {
    const alice = await createUser('Alice6');
    const bob = await createUser('Bob6');
    const outsider = await createUser('Intrus');
    const group = await createGroup(alice, 'Les humains');
    await joinGroup(bob, group.code);

    const written = server.groups.recordGameResults(group.id, 'DDDD', 1_700_000_300_000, [
      { userId: alice.id, score: 30, rank: 1, won: true },
      { userId: bob.id, score: 20, rank: 2, won: false },
      // Un robot : aucun compte, jamais membre d'un groupe
      { userId: `${BOT_ID_PREFIX}ada`, score: 99, rank: 1, won: true },
      // Un joueur humain de la partie qui ne fait pas partie du groupe
      { userId: outsider.id, score: 88, rank: 1, won: true },
    ]);
    expect(written).toBe(2);

    const { standings } = await detail(alice, group.id);
    expect(standings).toHaveLength(2);
    expect(standings.map((s) => s.pseudo).sort()).toEqual(['Alice6', 'Bob6']);
    expect(standings.some((s) => s.totalPoints === 99 || s.totalPoints === 88)).toBe(false);
  });

  it("n'enregistre pas deux fois la même partie", async () => {
    const alice = await createUser('Alice7');
    const group = await createGroup(alice, 'Les uniques');
    const results = [{ userId: alice.id, score: 10, rank: 1, won: true }];

    expect(server.groups.recordGameResults(group.id, 'EEEE', 1_700_000_400_000, results)).toBe(1);
    expect(server.groups.recordGameResults(group.id, 'EEEE', 1_700_000_400_000, results)).toBe(0);

    const { standings } = await detail(alice, group.id);
    expect(standings[0].gamesPlayed).toBe(1);
  });
});

describe('groupes d’amis — accès et cycle de vie', () => {
  it('refuse toute route de groupe sans session valide', async () => {
    const alice = await createUser('Alice8');
    const group = await createGroup(alice, 'Les privés');

    expect((await api('/api/groups')).status).toBe(401);
    expect((await api('/api/groups', { method: 'POST', body: { name: 'Pirates' } })).status).toBe(401);
    expect((await api('/api/groups/join', { method: 'POST', body: { code: group.code } })).status).toBe(401);
    expect((await api(`/api/groups/${group.id}`)).status).toBe(401);
    expect((await api(`/api/groups/${group.id}/leave`, { method: 'POST' })).status).toBe(401);
    expect((await api(`/api/groups/${group.id}`, { method: 'DELETE' })).status).toBe(401);

    // Un jeton bidon ne passe pas davantage
    expect((await api('/api/groups', { token: 'pas-un-jeton' })).status).toBe(401);
  });

  it('cache le détail d’un groupe à un non-membre', async () => {
    const alice = await createUser('Alice9');
    const stranger = await createUser('Étranger');
    const group = await createGroup(alice, 'Le cercle fermé');

    const res = await api(`/api/groups/${group.id}`, { token: stranger.token });
    expect(res.status).toBe(404);
    // Même réponse pour un identifiant inexistant : aucune fuite d'information
    expect((await api('/api/groups/inexistant', { token: stranger.token })).status).toBe(404);
  });

  it('laisse un membre quitter, mais pas le propriétaire', async () => {
    const alice = await createUser('Alice10');
    const bob = await createUser('Bob10');
    const group = await createGroup(alice, 'Les partants');
    await joinGroup(bob, group.code);

    // Le propriétaire ne peut que supprimer son groupe
    const ownerLeave = await api(`/api/groups/${group.id}/leave`, { method: 'POST', token: alice.token });
    expect(ownerLeave.status).toBe(409);
    expect(((await ownerLeave.json()) as { error: string }).error).toBe('OWNER_CANNOT_LEAVE');

    // Un membre ordinaire part sans problème
    expect((await api(`/api/groups/${group.id}/leave`, { method: 'POST', token: bob.token })).status).toBe(200);
    expect((await api(`/api/groups/${group.id}`, { token: bob.token })).status).toBe(404);
    expect((await detail(alice, group.id)).members).toHaveLength(1);
  });

  it('réserve la suppression au propriétaire', async () => {
    const alice = await createUser('Alice11');
    const bob = await createUser('Bob11');
    const group = await createGroup(alice, 'Les éphémères');
    await joinGroup(bob, group.code);

    expect((await api(`/api/groups/${group.id}`, { method: 'DELETE', token: bob.token })).status).toBe(403);
    expect((await api(`/api/groups/${group.id}`, { method: 'DELETE', token: alice.token })).status).toBe(200);
    expect((await api(`/api/groups/${group.id}`, { token: alice.token })).status).toBe(404);
    expect(((await (await api('/api/groups', { token: bob.token })).json()) as { groups: Group[] }).groups
      .map((g) => g.id)).not.toContain(group.id);
  });
});
