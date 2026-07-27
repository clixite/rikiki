import type Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type { GameHistoryEntry, PublicUser, UserStats } from '@rikiki/shared';

interface UserRow {
  id: string;
  pseudo: string;
  avatar: string;
  email: string | null;
  is_guest: number;
  created_at: number;
}

function toPublic(row: UserRow): PublicUser {
  return {
    id: row.id,
    pseudo: row.pseudo,
    avatar: row.avatar,
    email: row.email,
    isGuest: row.is_guest === 1,
  };
}

export class UsersRepo {
  constructor(private db: Database.Database) {}

  createGuest(pseudo: string, avatar: string): PublicUser {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare('INSERT INTO users (id, pseudo, avatar, is_guest, created_at) VALUES (?, ?, ?, 1, ?)')
      .run(id, pseudo, avatar, now);
    this.db.prepare('INSERT INTO stats (user_id, updated_at) VALUES (?, ?)').run(id, now);
    return this.getById(id)!;
  }

  getById(id: string): PublicUser | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? toPublic(row) : null;
  }

  getByEmail(email: string): PublicUser | null {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    return row ? toPublic(row) : null;
  }

  updateProfile(id: string, pseudo: string, avatar: string): void {
    this.db.prepare('UPDATE users SET pseudo = ?, avatar = ? WHERE id = ?').run(pseudo, avatar, id);
  }

  /** Promotion d'un invité en compte e-mail (conserve id, pseudo, stats). */
  attachEmail(id: string, email: string): void {
    this.db.prepare('UPDATE users SET email = ?, is_guest = 0 WHERE id = ?').run(email, id);
  }

  createWithEmail(email: string, pseudo: string, avatar: string): PublicUser {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare('INSERT INTO users (id, pseudo, avatar, email, is_guest, created_at) VALUES (?, ?, ?, ?, 0, ?)')
      .run(id, pseudo, avatar, email, now);
    this.db.prepare('INSERT INTO stats (user_id, updated_at) VALUES (?, ?)').run(id, now);
    return this.getById(id)!;
  }

  getStats(userId: string): UserStats {
    const row = this.db.prepare('SELECT * FROM stats WHERE user_id = ?').get(userId) as
      | { games_played: number; games_won: number; total_points: number; best_round: number }
      | undefined;
    return {
      gamesPlayed: row?.games_played ?? 0,
      gamesWon: row?.games_won ?? 0,
      totalPoints: row?.total_points ?? 0,
      bestRound: row?.best_round ?? 0,
    };
  }

  /** Enregistre une partie terminée dans l'historique du joueur. */
  addHistoryEntry(entry: {
    userId: string;
    code: string;
    playedAt: number;
    playersCount: number;
    myScore: number;
    myRank: number;
    won: boolean;
    standings: { pseudo: string; avatar: string; score: number }[];
  }): void {
    this.db
      .prepare(
        `INSERT INTO game_history
           (user_id, code, played_at, players_count, my_score, my_rank, won, standings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        entry.userId,
        entry.code,
        entry.playedAt,
        entry.playersCount,
        entry.myScore,
        entry.myRank,
        entry.won ? 1 : 0,
        JSON.stringify(entry.standings),
      );
  }

  /** Dernières parties terminées, les plus récentes d'abord. */
  getHistory(userId: string, limit = 20): GameHistoryEntry[] {
    const rows = this.db
      .prepare(
        `SELECT code, played_at, players_count, my_score, my_rank, won, standings
           FROM game_history WHERE user_id = ?
          ORDER BY played_at DESC LIMIT ?`,
      )
      .all(userId, limit) as {
      code: string;
      played_at: number;
      players_count: number;
      my_score: number;
      my_rank: number;
      won: number;
      standings: string;
    }[];

    return rows.map((r) => ({
      code: r.code,
      playedAt: r.played_at,
      playersCount: r.players_count,
      myScore: r.my_score,
      myRank: r.my_rank,
      won: r.won === 1,
      standings: JSON.parse(r.standings) as GameHistoryEntry['standings'],
    }));
  }

  recordGameResult(userId: string, points: number, won: boolean, bestRound: number): void {
    this.db
      .prepare(
        `INSERT INTO stats (user_id, games_played, games_won, total_points, best_round, updated_at)
         VALUES (?, 1, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           games_played = games_played + 1,
           games_won = games_won + excluded.games_won,
           total_points = total_points + excluded.total_points,
           best_round = MAX(best_round, excluded.best_round),
           updated_at = excluded.updated_at`,
      )
      .run(userId, won ? 1 : 0, points, bestRound, Date.now());
  }
}
