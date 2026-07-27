import { Router } from 'express';
import { z } from 'zod';
import type { Config } from '../config';
import type { GroupsRepo } from '../db/groups.repo';
import type { UsersRepo } from '../db/users.repo';
import { bearerUserId } from '../auth/routes';
import { isValidGroupCodeFormat, normalizeCode } from '../rooms/roomCodes';

/** Un nom de groupe court et lisible : « Les copains du mardi ». */
const createSchema = z.object({
  name: z.string().trim().min(2).max(30),
});

const joinSchema = z.object({
  code: z.string().trim().min(1).max(16),
});

/** Nombre maximal de groupes détenus par un même joueur (garde-fou anti-spam). */
const MAX_GROUPS_PER_USER = 20;

/**
 * Routes des groupes d'amis. Toutes exigent une session valide (Bearer JWT).
 *
 * Règle du propriétaire : le créateur d'un groupe ne peut pas le « quitter ».
 * Il peut uniquement le supprimer (DELETE), ce qui efface membres et
 * résultats. Un groupe a donc toujours exactement un propriétaire, et il n'y a
 * jamais de groupe orphelin — pas de transfert de propriété à gérer.
 */
export function groupRoutes(groups: GroupsRepo, users: UsersRepo, config: Config): Router {
  const router = Router();

  /** Renvoie l'id du joueur authentifié, ou `null` après avoir répondu 401. */
  const requireUser = (req: import('express').Request, res: import('express').Response): string | null => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    if (!userId || !users.getById(userId)) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return null;
    }
    return userId;
  };

  router.get('/groups', (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    res.json({ groups: groups.listForUser(userId) });
  });

  router.post('/groups', (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Le nom du groupe doit faire entre 2 et 30 caractères.' });
      return;
    }
    if (groups.listForUser(userId).filter((g) => g.ownerId === userId).length >= MAX_GROUPS_PER_USER) {
      res.status(429).json({ error: 'TOO_MANY_GROUPS', message: 'Tu as déjà créé trop de groupes.' });
      return;
    }
    res.status(201).json({ group: groups.create(userId, parsed.data.name) });
  });

  router.post('/groups/join', (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Code de groupe requis.' });
      return;
    }
    const code = normalizeCode(parsed.data.code);
    if (!isValidGroupCodeFormat(code)) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Code de groupe invalide (6 lettres).' });
      return;
    }
    const group = groups.getByCode(code);
    if (!group) {
      res.status(404).json({ error: 'GROUP_NOT_FOUND', message: 'Aucun groupe avec ce code.' });
      return;
    }
    if (!groups.join(group.id, userId)) {
      res.status(409).json({ error: 'ALREADY_MEMBER', message: 'Tu fais déjà partie de ce groupe.' });
      return;
    }
    res.json({ group: groups.getById(group.id) });
  });

  router.get('/groups/:id', (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const detail = groups.getDetail(req.params.id);
    // Un non-membre ne doit pas pouvoir distinguer « groupe inexistant » de
    // « groupe dont je ne fais pas partie » : même réponse dans les deux cas.
    if (!detail || !groups.isMember(detail.group.id, userId)) {
      res.status(404).json({ error: 'GROUP_NOT_FOUND', message: 'Groupe introuvable.' });
      return;
    }
    res.json(detail);
  });

  router.post('/groups/:id/leave', (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const group = groups.getById(req.params.id);
    if (!group || !groups.isMember(group.id, userId)) {
      res.status(404).json({ error: 'GROUP_NOT_FOUND', message: 'Groupe introuvable.' });
      return;
    }
    if (group.ownerId === userId) {
      res.status(409).json({
        error: 'OWNER_CANNOT_LEAVE',
        message: 'Tu as créé ce groupe : tu peux seulement le supprimer.',
      });
      return;
    }
    groups.leave(group.id, userId);
    res.json({ ok: true });
  });

  router.delete('/groups/:id', (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    const group = groups.getById(req.params.id);
    if (!group || !groups.isMember(group.id, userId)) {
      res.status(404).json({ error: 'GROUP_NOT_FOUND', message: 'Groupe introuvable.' });
      return;
    }
    if (group.ownerId !== userId) {
      res.status(403).json({ error: 'NOT_OWNER', message: 'Seul le créateur du groupe peut le supprimer.' });
      return;
    }
    groups.remove(group.id);
    res.json({ ok: true });
  });

  return router;
}
