import { isBotId } from '@rikiki/shared';
import type { PushRepo, PushSubscriptionInput } from '../db/push.repo';
import type { PushSender } from './sender';

/** Statuts renvoyés par un service push quand l'abonnement n'existe plus. */
const GONE_STATUS_CODES = new Set([404, 410]);

/** Charge utile lue par le service worker (`client/public/push-sw.js`). */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/**
 * Critère d'envoi d'une notification « c'est ton tour ».
 *
 * Le serveur ne peut pas savoir si l'application est au premier plan : on
 * n'envoie donc que si le joueur n'a **aucun** socket rattaché à la partie.
 * Les joueurs automatiques ne sont jamais notifiés.
 */
export function shouldNotifyTurn(playerId: string, hasSocketInRoom: boolean): boolean {
  return !isBotId(playerId) && !hasSocketInRoom;
}

export class PushService {
  constructor(
    private repo: PushRepo,
    private sender: PushSender,
    /** Clé publique VAPID exposée au client pour créer un abonnement. */
    readonly publicKey: string,
  ) {}

  subscribe(userId: string, sub: PushSubscriptionInput): void {
    this.repo.save(userId, sub);
  }

  unsubscribe(endpoint: string): void {
    this.repo.remove(endpoint);
  }

  unsubscribeAll(userId: string): void {
    this.repo.removeAllForUser(userId);
  }

  isSubscribed(userId: string): boolean {
    return this.repo.countByUser(userId) > 0;
  }

  /**
   * Envoie la charge utile à tous les appareils d'un joueur.
   * Un abonnement expiré (404/410) est supprimé au passage.
   * Renvoie le nombre d'envois réussis.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    const subs = this.repo.listByUser(userId);
    if (subs.length === 0) return 0;
    const body = JSON.stringify(payload);
    let delivered = 0;
    for (const sub of subs) {
      const res = await this.sender.send({ endpoint: sub.endpoint, keys: sub.keys }, body);
      if (res.ok) {
        delivered += 1;
      } else if (GONE_STATUS_CODES.has(res.statusCode)) {
        this.repo.remove(sub.endpoint);
      }
    }
    return delivered;
  }

  /** Notifie un joueur que la table l'attend (annonce ou carte à jouer). */
  notifyTurn(userId: string, room: { code: string; phase: 'bidding' | 'playing' }): Promise<number> {
    return this.sendToUser(userId, {
      title: 'À toi de jouer ! 🃏',
      body:
        room.phase === 'bidding'
          ? `Partie ${room.code} : annonce ton nombre de plis.`
          : `Partie ${room.code} : c'est à toi de poser une carte.`,
      url: '/game',
      // Un seul avis par partie à l'écran : les tours ne s'empilent pas.
      tag: `rikiki-turn-${room.code}`,
    });
  }
}
