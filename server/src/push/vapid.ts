import webpush from 'web-push';
import type { SettingsRepo } from '../db/settings.repo';

const PUBLIC_KEY_SETTING = 'vapid_public_key';
const PRIVATE_KEY_SETTING = 'vapid_private_key';

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  /** Identité du serveur exigée par la spécification VAPID (mailto: ou URL). */
  subject: string;
}

/**
 * Résout les clés VAPID :
 *   1. variables d'environnement `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` ;
 *   2. sinon, clés déjà persistées dans `server_settings` ;
 *   3. sinon, génération d'une paire neuve, immédiatement persistée.
 *
 * La persistance est indispensable : changer de clé publique invalide tous les
 * abonnements déjà enregistrés par les navigateurs.
 */
export function resolveVapidKeys(
  settings: SettingsRepo,
  env: { VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; VAPID_SUBJECT?: string; PUBLIC_URL: string },
): VapidKeys {
  const subject = env.VAPID_SUBJECT?.trim() || env.PUBLIC_URL;

  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    return { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject };
  }

  const storedPublic = settings.get(PUBLIC_KEY_SETTING);
  const storedPrivate = settings.get(PRIVATE_KEY_SETTING);
  if (storedPublic && storedPrivate) {
    return { publicKey: storedPublic, privateKey: storedPrivate, subject };
  }

  const generated = webpush.generateVAPIDKeys();
  settings.set(PUBLIC_KEY_SETTING, generated.publicKey);
  settings.set(PRIVATE_KEY_SETTING, generated.privateKey);
  return { publicKey: generated.publicKey, privateKey: generated.privateKey, subject };
}
