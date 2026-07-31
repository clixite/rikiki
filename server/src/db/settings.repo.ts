import type Database from 'better-sqlite3';

/**
 * Réglages persistants du serveur (table `server_settings`).
 * Sert notamment à conserver les clés VAPID générées au premier démarrage :
 * sans persistance, tous les abonnements push seraient invalidés à chaque
 * redémarrage.
 */
export class SettingsRepo {
  constructor(private db: Database.Database) {}

  get(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM server_settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO server_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(key, value);
  }
}
