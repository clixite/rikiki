import type Database from 'better-sqlite3';
import type { GameState } from '@rikiki/shared';

/** Une partie persistée, telle que relue au démarrage du serveur. */
export interface LiveRoomRow {
  code: string;
  state: GameState;
  updatedAt: number;
}

/**
 * Persistance des parties en cours (table `live_rooms`).
 *
 * Un `GameState` est entièrement sérialisable en JSON (joueurs, manche,
 * mains, scores) : on le stocke tel quel, ce qui permet de recharger les
 * tables en train de jouer après un redémarrage du serveur (déploiement,
 * crash, reboot). Seules les données de jeu sont persistées ; tout ce qui
 * est propre au processus (sockets, timers) est reconstruit à la reprise.
 */
export class LiveRoomsRepo {
  constructor(private db: Database.Database) {}

  /** Écrit (ou remplace) l'état d'une partie. */
  save(code: string, state: GameState, now = Date.now()): void {
    this.db
      .prepare(
        `INSERT INTO live_rooms (code, state, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET
           state = excluded.state,
           updated_at = excluded.updated_at`,
      )
      .run(code, JSON.stringify(state), now);
  }

  delete(code: string): void {
    this.db.prepare('DELETE FROM live_rooms WHERE code = ?').run(code);
  }

  /**
   * Toutes les parties persistées, les plus récentes d'abord.
   * Une ligne illisible (format modifié entre deux versions du serveur) est
   * ignorée et purgée plutôt que de faire échouer le démarrage.
   */
  loadAll(): LiveRoomRow[] {
    const rows = this.db
      .prepare('SELECT code, state, updated_at FROM live_rooms ORDER BY updated_at DESC')
      .all() as { code: string; state: string; updated_at: number }[];

    const out: LiveRoomRow[] = [];
    for (const row of rows) {
      try {
        out.push({ code: row.code, state: JSON.parse(row.state) as GameState, updatedAt: row.updated_at });
      } catch {
        this.delete(row.code);
      }
    }
    return out;
  }

  /** Purge les parties dont le dernier enregistrement date d'avant `ts`. */
  deleteOlderThan(ts: number): void {
    this.db.prepare('DELETE FROM live_rooms WHERE updated_at < ?').run(ts);
  }
}
