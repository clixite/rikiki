import crypto from 'node:crypto';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  PUBLIC_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().optional(),
  DB_PATH: z.string().default('./data/rikiki.db'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  /** Délai minimal (ms) avant qu'un joueur automatique ne joue. 0 = instantané. */
  BOT_DELAY_MS: z.coerce.number().min(0).default(800),
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
