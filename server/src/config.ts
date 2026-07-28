import crypto from 'node:crypto';
import { z } from 'zod';

/**
 * Une variable présente mais vide (`MAIL_PROVIDER=` dans un fichier `.env`, cas
 * courant avec `env_file` de Docker Compose) vaut « non renseignée » : sans ce
 * nettoyage, la chaîne vide ferait échouer les énumérations et passerait les
 * tests de présence des chaînes optionnelles.
 */
const blankAsAbsent = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalText = z.preprocess(blankAsAbsent, z.string().optional());

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  PUBLIC_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().optional(),
  DB_PATH: z.string().default('./data/rikiki.db'),
  /**
   * Fournisseur d'envoi des liens magiques. Absent : déduit des clés présentes
   * (voir `detectProvider`), ce qui suffit dans la quasi-totalité des cas.
   */
  MAIL_PROVIDER: z.preprocess(blankAsAbsent, z.enum(['resend', 'brevo', 'smtp', 'console']).optional()),
  /** Expéditeur commun à tous les fournisseurs : « Rikiki <no-reply@domaine.fr> ». */
  MAIL_FROM: optionalText,
  /** Clé d'API Resend (`re_…`) — offre gratuite, envoi par HTTPS. */
  RESEND_API_KEY: optionalText,
  /** Clé d'API Brevo (`xkeysib-…`) — offre gratuite, envoi par HTTPS. */
  BREVO_API_KEY: optionalText,
  SMTP_HOST: optionalText,
  SMTP_PORT: z.preprocess(blankAsAbsent, z.coerce.number().default(465)),
  SMTP_USER: optionalText,
  SMTP_PASS: optionalText,
  /** Historique : conservé comme repli de `MAIL_FROM`. */
  SMTP_FROM: optionalText,
  NODE_ENV: z.string().default('development'),
  /** Délai minimal (ms) avant qu'un joueur automatique ne joue. 0 = instantané. */
  BOT_DELAY_MS: z.coerce.number().min(0).default(800),
  /**
   * Clés VAPID des notifications « c'est ton tour ». Si elles sont absentes,
   * une paire est générée au premier démarrage puis persistée en base.
   */
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  /** Identité du serveur pour VAPID (mailto:… ou URL) ; défaut : PUBLIC_URL. */
  VAPID_SUBJECT: z.string().optional(),
});

export type Config = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.parse(env);
  let jwtSecret = parsed.JWT_SECRET;
  if (!jwtSecret) {
    if (parsed.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET est requis en production');
    }
    jwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[config] JWT_SECRET absent — secret éphémère généré (dev uniquement)');
  }
  return { ...parsed, JWT_SECRET: jwtSecret };
}
