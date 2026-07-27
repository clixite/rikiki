import { Router } from 'express';
import { z } from 'zod';
import type { Config } from '../config';
import type { UsersRepo } from '../db/users.repo';
import { bearerUserId } from '../auth/routes';
import type { PushService } from './PushService';

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
});

export function pushRoutes(push: PushService, users: UsersRepo, config: Config): Router {
  const router = Router();

  /** Clé publique VAPID : nécessaire au navigateur avant tout abonnement. */
  router.get('/push/public-key', (_req, res) => {
    res.json({ publicKey: push.publicKey });
  });

  const requireUser = (authHeader: string | undefined): string | null => {
    const userId = bearerUserId(authHeader, config.JWT_SECRET);
    return userId && users.getById(userId) ? userId : null;
  };

  /** État réel de l'abonnement côté serveur (le réglage du client s'y aligne). */
  router.get('/push/subscription', (req, res) => {
    const userId = requireUser(req.headers.authorization);
    if (!userId) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    res.json({ subscribed: push.isSubscribed(userId) });
  });

  router.post('/push/subscribe', (req, res) => {
    const userId = requireUser(req.headers.authorization);
    if (!userId) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    const parsed = subscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Abonnement push invalide.' });
      return;
    }
    push.subscribe(userId, parsed.data);
    res.json({ ok: true, subscribed: true });
  });

  router.post('/push/unsubscribe', (req, res) => {
    const userId = requireUser(req.headers.authorization);
    if (!userId) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    const parsed = unsubscribeSchema.safeParse(req.body);
    if (parsed.success) {
      push.unsubscribe(parsed.data.endpoint);
    } else {
      // Sans endpoint exploitable, on coupe toutes les notifications du joueur.
      push.unsubscribeAll(userId);
    }
    res.json({ ok: true, subscribed: push.isSubscribed(userId) });
  });

  return router;
}
