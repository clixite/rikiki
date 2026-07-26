import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type Database from 'better-sqlite3';
import type { Config } from '../config';
import type { UsersRepo } from '../db/users.repo';
import type { Mailer } from '../mail/mailer';
import { bearerUserId } from './routes';
import { signToken } from './tokens';

const LINK_TTL_MS = 15 * 60_000;
const MAX_ACTIVE_LINKS = 3;

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email() });

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function magicLinkRoutes(db: Database.Database, users: UsersRepo, config: Config, mailer: Mailer): Router {
  const router = Router();

  router.post('/auth/magic-link', async (req, res) => {
    if (!mailer.enabled) {
      res.status(503).json({ error: 'SMTP_DISABLED', message: "L'envoi d'e-mails n'est pas configuré sur ce serveur." });
      return;
    }
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Adresse e-mail invalide.' });
      return;
    }
    const { email } = parsed.data;

    const active = db
      .prepare('SELECT COUNT(*) AS n FROM magic_links WHERE email = ? AND expires_at > ? AND used_at IS NULL')
      .get(email, Date.now()) as { n: number };
    if (active.n >= MAX_ACTIVE_LINKS) {
      res.status(429).json({ error: 'RATE_LIMITED', message: 'Trop de demandes. Réessaie dans quelques minutes.' });
      return;
    }

    // Si la demande vient d'un invité connecté, on retiendra son compte pour le promouvoir
    const requesterId = bearerUserId(req.headers.authorization, config.JWT_SECRET);

    const token = crypto.randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO magic_links (token_hash, user_id, email, expires_at) VALUES (?, ?, ?, ?)').run(
      hashToken(token),
      requesterId,
      email,
      Date.now() + LINK_TTL_MS,
    );

    const url = `${config.PUBLIC_URL.replace(/\/$/, '')}/verify?t=${token}`;
    try {
      await mailer.sendMagicLink(email, url);
    } catch (e) {
      console.error('[mail] échec envoi magic link:', e);
      res.status(502).json({ error: 'MAIL_FAILED', message: "L'e-mail n'a pas pu être envoyé. Réessaie plus tard." });
      return;
    }
    res.json({ ok: true });
  });

  router.get('/auth/verify', (req, res) => {
    const token = String(req.query.t ?? '');
    if (!token) {
      res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Lien invalide.' });
      return;
    }
    const row = db.prepare('SELECT * FROM magic_links WHERE token_hash = ?').get(hashToken(token)) as
      | { token_hash: string; user_id: string | null; email: string; expires_at: number; used_at: number | null }
      | undefined;
    if (!row || row.used_at !== null || row.expires_at < Date.now()) {
      res.status(400).json({ error: 'LINK_EXPIRED', message: 'Lien invalide ou expiré.' });
      return;
    }
    db.prepare('UPDATE magic_links SET used_at = ? WHERE token_hash = ?').run(Date.now(), row.token_hash);

    // 1. Un compte existe déjà avec cet e-mail : on s'y connecte
    let user = users.getByEmail(row.email);
    if (!user) {
      const requester = row.user_id ? users.getById(row.user_id) : null;
      if (requester && requester.isGuest) {
        // 2. Promotion de l'invité : id, pseudo, avatar et stats conservés
        users.attachEmail(requester.id, row.email);
        user = users.getById(requester.id);
      } else {
        // 3. Nouveau compte e-mail
        user = users.createWithEmail(row.email, row.email.split('@')[0].slice(0, 20) || 'Joueur', '🦊');
      }
    }
    res.json({ token: signToken(user!.id, config.JWT_SECRET), user });
  });

  return router;
}
