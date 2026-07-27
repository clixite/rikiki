import webpush from 'web-push';
import type { PushSubscriptionInput } from '../db/push.repo';
import type { VapidKeys } from './vapid';

/** Résultat d'un envoi : le statut HTTP permet de purger les abonnements morts. */
export type PushSendResult = { ok: true } | { ok: false; statusCode: number };

/**
 * Transporteur d'envoi push. Abstrait pour pouvoir injecter un faux
 * transporteur dans les tests (même principe que `Mailer`).
 */
export interface PushSender {
  send(subscription: PushSubscriptionInput, payload: string): Promise<PushSendResult>;
}

/** Transporteur réel, adossé à la bibliothèque `web-push`. */
export function createWebPushSender(vapid: VapidKeys): PushSender {
  return {
    async send(subscription, payload) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, payload, {
          vapidDetails: { subject: vapid.subject, publicKey: vapid.publicKey, privateKey: vapid.privateKey },
          TTL: 600,
        });
        return { ok: true };
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode ?? 0;
        return { ok: false, statusCode };
      }
    },
  };
}
