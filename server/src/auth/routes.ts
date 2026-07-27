import { Router } from 'express';
import { z } from 'zod';
import type { UsersRepo } from '../db/users.repo';
import type { Config } from '../config';
import { signToken, verifyToken } from './tokens';

export const profileSchema = z.object({
  pseudo: z.string().trim().min(2).max(20),
  avatar: z.string().min(1).max(8),
});

export function bearerUserId(authHeader: string | undefined, secret: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7), secret);
}

export function authRoutes(users: UsersRepo, config: Config): Router {
  const router = Router();

  router.post('/auth/guest', (req, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Pseudo (2-20 caractères) et avatar requis.' });
      return;
    }
    const user = users.createGuest(parsed.data.pseudo, parsed.data.avatar);
    res.json({ token: signToken(user.id, config.JWT_SECRET), user });
  });

  router.get('/me', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    const user = userId ? users.getById(userId) : null;
    if (!user) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    res.json({ user, stats: users.getStats(user.id) });
  });

  router.get('/me/history', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    if (!userId || !users.getById(userId)) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    res.json({ games: users.getHistory(userId, 20) });
  });

  router.patch('/me', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    const user = userId ? users.getById(userId) : null;
    if (!user) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Profil invalide.' });
      return;
    }
    users.updateProfile(user.id, parsed.data.pseudo, parsed.data.avatar);
    res.json({ user: users.getById(user.id) });
  });

  // Suppression du compte depuis l'application — exigée par l'App Store dès
  // lors qu'une création de compte est proposée (règle 5.1.1(v)).
  router.delete('/me', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    const user = userId ? users.getById(userId) : null;
    if (!user) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    users.deleteAccount(user.id);
    res.json({ ok: true });
  });

  return router;
}
