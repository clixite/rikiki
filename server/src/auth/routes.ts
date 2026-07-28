import { Router } from 'express';
import { z } from 'zod';
import type { UsersRepo } from '../db/users.repo';
import type { Config } from '../config';
import { signToken, verifyToken } from './tokens';

/** Vignette JPEG en data URL, ou `null` pour revenir à l'avatar dessiné. */
export const photoSchema = z.object({
  photo: z
    .string()
    .max(90_000)
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/)
    .nullable(),
});

/** Signalement : cible et motif court, choisi dans une liste fermée. */
export const reportSchema = z.object({
  playerId: z.string().min(1).max(64),
  reason: z.enum(['photo', 'pseudo', 'other']),
});

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

  /**
   * Photo de profil.
   *
   * La vignette arrive déjà réduite par le client (192 px, JPEG). On revérifie
   * ici : la taille, parce qu'un client modifié pourrait envoyer n'importe
   * quoi, et le préfixe, pour ne jamais stocker autre chose qu'une image.
   */
  router.put('/me/photo', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    const user = userId ? users.getById(userId) : null;
    if (!user) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    const parsed = photoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Photo invalide.' });
      return;
    }
    users.updatePhoto(user.id, parsed.data.photo);
    res.json({ user: users.getById(user.id) });
  });

  /**
   * Signalement d'un joueur.
   *
   * Exigé par l'App Store (règle 1.2) dès qu'un joueur peut publier un contenu
   * visible par d'autres — ici sa photo de profil. Le masquage est immédiat et
   * local ; ce signalement sert à la relecture humaine.
   */
  router.post('/report', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    if (!userId || !users.getById(userId)) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.playerId === userId) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Signalement invalide.' });
      return;
    }
    users.addReport(userId, parsed.data.playerId, parsed.data.reason);
    res.json({ ok: true });
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
