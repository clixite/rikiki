import type Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type { Group, GroupDetail, GroupGame, GroupMember, GroupStanding } from '@rikiki/shared';
import { GROUP_CODE_LENGTH, randomCode } from '../rooms/roomCodes';

/** Nombre maximal de tirages avant d'abandonner sur collision de code. */
const CODE_ATTEMPTS = 30;

interface GroupRow {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: number;
  members_count: number;
  games_count: number;
}

function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    membersCount: row.members_count,
    gamesCount: row.games_count,
  };
}

/**
 * Colonnes calculées communes à toutes les lectures de groupe : nombre de
 * membres et nombre de parties distinctes déjà rattachées au groupe.
 */
const GROUP_SELECT = `
  SELECT g.id, g.name, g.code, g.owner_id, g.created_at,
         (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) AS members_count,
         (SELECT COUNT(DISTINCT r.code || ':' || r.played_at)
            FROM group_results r WHERE r.group_id = g.id) AS games_count
    FROM groups g`;

export class GroupsRepo {
  constructor(private db: Database.Database) {}

  /**
   * Crée un groupe et y inscrit d'office son propriétaire.
   * Le code de partage est tiré au hasard sur l'alphabet lisible ; en cas de
   * collision (contrainte UNIQUE) on retire un nouveau code.
   */
  create(ownerId: string, name: string): Group {
    const id = crypto.randomUUID();
    const now = Date.now();

    const insertGroup = this.db.prepare(
      'INSERT INTO groups (id, name, code, owner_id, created_at) VALUES (?, ?, ?, ?, ?)',
    );
    const insertMember = this.db.prepare(
      'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)',
    );

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const code = randomCode(GROUP_CODE_LENGTH);
      try {
        this.db.transaction(() => {
          insertGroup.run(id, name, code, ownerId, now);
          insertMember.run(id, ownerId, now);
        })();
        return this.getById(id)!;
      } catch (err) {
        // Seule une collision de code est rattrapable : tout le reste remonte.
        const message = err instanceof Error ? err.message : '';
        if (!message.includes('groups.code')) throw err;
      }
    }
    throw new Error('Impossible de générer un code de groupe unique');
  }

  getById(id: string): Group | null {
    const row = this.db.prepare(`${GROUP_SELECT} WHERE g.id = ?`).get(id) as GroupRow | undefined;
    return row ? toGroup(row) : null;
  }

  getByCode(code: string): Group | null {
    const row = this.db.prepare(`${GROUP_SELECT} WHERE g.code = ?`).get(code) as GroupRow | undefined;
    return row ? toGroup(row) : null;
  }

  isMember(groupId: string, userId: string): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?')
      .get(groupId, userId);
    return row !== undefined;
  }

  /** Inscrit un joueur ; renvoie `false` s'il était déjà membre. */
  join(groupId: string, userId: string): boolean {
    if (this.isMember(groupId, userId)) return false;
    this.db
      .prepare('INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)')
      .run(groupId, userId, Date.now());
    return true;
  }

  /**
   * Retire un joueur du groupe. Ses résultats passés restent enregistrés :
   * le classement historique du groupe n'est pas réécrit à son départ.
   */
  leave(groupId: string, userId: string): void {
    this.db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').run(groupId, userId);
  }

  /** Supprime le groupe ; membres et résultats partent en cascade. */
  remove(groupId: string): void {
    this.db.prepare('DELETE FROM group_results WHERE group_id = ?').run(groupId);
    this.db.prepare('DELETE FROM group_members WHERE group_id = ?').run(groupId);
    this.db.prepare('DELETE FROM groups WHERE id = ?').run(groupId);
  }

  /** Mes groupes, le plus récemment rejoint en tête. */
  listForUser(userId: string): Group[] {
    const rows = this.db
      .prepare(
        `${GROUP_SELECT}
           JOIN group_members me ON me.group_id = g.id AND me.user_id = ?
          ORDER BY me.joined_at DESC`,
      )
      .all(userId) as GroupRow[];
    return rows.map(toGroup);
  }

  getMembers(groupId: string): GroupMember[] {
    const rows = this.db
      .prepare(
        `SELECT m.user_id, m.joined_at, u.pseudo, u.avatar, g.owner_id
           FROM group_members m
           JOIN users u ON u.id = m.user_id
           JOIN groups g ON g.id = m.group_id
          WHERE m.group_id = ?
          ORDER BY m.joined_at ASC`,
      )
      .all(groupId) as { user_id: string; joined_at: number; pseudo: string; avatar: string; owner_id: string }[];

    return rows.map((r) => ({
      userId: r.user_id,
      pseudo: r.pseudo,
      avatar: r.avatar,
      joinedAt: r.joined_at,
      isOwner: r.user_id === r.owner_id,
    }));
  }

  /**
   * Enregistre le résultat d'une partie terminée pour un groupe.
   *
   * Deux garde-fous : les joueurs qui ne sont pas membres du groupe (robots
   * compris, qui n'ont de toute façon aucun compte) sont ignorés, et une même
   * partie n'est jamais enregistrée deux fois pour un même groupe.
   * Renvoie le nombre de lignes réellement écrites.
   */
  recordGameResults(
    groupId: string,
    code: string,
    playedAt: number,
    results: { userId: string; score: number; rank: number; won: boolean }[],
  ): number {
    if (!this.getById(groupId)) return 0;

    const already = this.db
      .prepare('SELECT 1 FROM group_results WHERE group_id = ? AND code = ? AND played_at = ?')
      .get(groupId, code, playedAt);
    if (already) return 0;

    const eligible = results.filter((r) => this.isMember(groupId, r.userId));
    if (eligible.length === 0) return 0;

    const insert = this.db.prepare(
      `INSERT INTO group_results (group_id, user_id, code, played_at, score, rank, won)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    this.db.transaction(() => {
      for (const r of eligible) {
        insert.run(groupId, r.userId, code, playedAt, r.score, r.rank, r.won ? 1 : 0);
      }
    })();
    return eligible.length;
  }

  /**
   * Classement cumulé du groupe : tous les membres apparaissent, y compris
   * ceux qui n'ont encore joué aucune partie (à zéro). Tri par points totaux,
   * puis victoires, puis pseudo.
   */
  getStandings(groupId: string): GroupStanding[] {
    const rows = this.db
      .prepare(
        `SELECT m.user_id, u.pseudo, u.avatar,
                COALESCE(SUM(r.score), 0) AS total_points,
                COUNT(r.id) AS games_played,
                COALESCE(SUM(r.won), 0) AS games_won
           FROM group_members m
           JOIN users u ON u.id = m.user_id
           LEFT JOIN group_results r
                  ON r.group_id = m.group_id AND r.user_id = m.user_id
          WHERE m.group_id = ?
          GROUP BY m.user_id, u.pseudo, u.avatar
          ORDER BY total_points DESC, games_won DESC, u.pseudo ASC`,
      )
      .all(groupId) as {
      user_id: string;
      pseudo: string;
      avatar: string;
      total_points: number;
      games_played: number;
      games_won: number;
    }[];

    return rows.map((r) => ({
      userId: r.user_id,
      pseudo: r.pseudo,
      avatar: r.avatar,
      totalPoints: r.total_points,
      gamesPlayed: r.games_played,
      gamesWon: r.games_won,
    }));
  }

  /** Dernières parties du groupe, les plus récentes d'abord. */
  getRecentGames(groupId: string, limit = 10): GroupGame[] {
    const rows = this.db
      .prepare(
        `SELECT r.code, r.played_at, r.user_id, r.score, r.rank, r.won, u.pseudo, u.avatar
           FROM group_results r
           JOIN users u ON u.id = r.user_id
          WHERE r.group_id = ?
          ORDER BY r.played_at DESC, r.rank ASC`,
      )
      .all(groupId) as {
      code: string;
      played_at: number;
      user_id: string;
      score: number;
      rank: number;
      won: number;
      pseudo: string;
      avatar: string;
    }[];

    // Une partie = un (code, played_at) ; les lignes arrivent déjà groupées.
    const games = new Map<string, GroupGame>();
    for (const r of rows) {
      const key = `${r.code}:${r.played_at}`;
      let game = games.get(key);
      if (!game) {
        if (games.size >= limit) continue;
        game = { code: r.code, playedAt: r.played_at, results: [] };
        games.set(key, game);
      }
      game.results.push({
        userId: r.user_id,
        pseudo: r.pseudo,
        avatar: r.avatar,
        score: r.score,
        rank: r.rank,
        won: r.won === 1,
      });
    }
    return [...games.values()];
  }

  /** Vue complète d'un groupe pour l'écran de détail. */
  getDetail(groupId: string): GroupDetail | null {
    const group = this.getById(groupId);
    if (!group) return null;
    return {
      group,
      members: this.getMembers(groupId),
      standings: this.getStandings(groupId),
      recentGames: this.getRecentGames(groupId),
    };
  }
}
