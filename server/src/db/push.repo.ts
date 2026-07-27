import type Database from 'better-sqlite3';

/** Abonnement Web Push tel que fourni par le navigateur (`PushSubscription`). */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Abonnement stocké, avec le joueur auquel il appartient. */
export interface StoredPushSubscription extends PushSubscriptionInput {
  userId: string;
  createdAt: number;
}

interface Row {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  created_at: number;
}

function toSubscription(row: Row): StoredPushSubscription {
  return {
    endpoint: row.endpoint,
    userId: row.user_id,
    keys: { p256dh: row.p256dh, auth: row.auth },
    createdAt: row.created_at,
  };
}

/** Accès à la table `push_subscriptions` (un joueur peut avoir plusieurs appareils). */
export class PushRepo {
  constructor(private db: Database.Database) {}

  /**
   * Enregistre (ou réattribue) un abonnement. Un même `endpoint` peut changer
   * de propriétaire si l'appareil est prêté ou si le compte invité est promu.
   */
  save(userId: string, sub: PushSubscriptionInput): void {
    this.db
      .prepare(
        `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth`,
      )
      .run(sub.endpoint, userId, sub.keys.p256dh, sub.keys.auth, Date.now());
  }

  remove(endpoint: string): void {
    this.db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  }

  /** Désabonnement complet d'un joueur (tous ses appareils). */
  removeAllForUser(userId: string): void {
    this.db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
  }

  listByUser(userId: string): StoredPushSubscription[] {
    const rows = this.db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId) as Row[];
    return rows.map(toSubscription);
  }

  countByUser(userId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?')
      .get(userId) as { n: number };
    return row.n;
  }
}
