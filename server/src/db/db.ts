import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  pseudo TEXT NOT NULL,
  avatar TEXT NOT NULL,
  email TEXT UNIQUE,
  is_guest INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE IF NOT EXISTS game_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  players_count INTEGER NOT NULL,
  my_score INTEGER NOT NULL,
  my_rank INTEGER NOT NULL,
  won INTEGER NOT NULL,
  /* Classement complet sérialisé : [{pseudo, avatar, score}] */
  standings TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_history_user
  ON game_history(user_id, played_at DESC);

CREATE TABLE IF NOT EXISTS stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  best_round INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

/* Parties en cours, sérialisées : permet de survivre à un redémarrage
   du serveur sans interrompre les tables en train de jouer. */
CREATE TABLE IF NOT EXISTS live_rooms (
  code TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

/* Abonnements aux notifications « c'est ton tour » (Web Push). */
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

/* Clés VAPID et autres réglages persistants du serveur. */
CREATE TABLE IF NOT EXISTS server_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

/* Groupes d'amis : classement cumulé sur les parties jouées ensemble. */
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

/* Résultat d'une partie rattachée à un groupe (une ligne par joueur). */
CREATE TABLE IF NOT EXISTS group_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  won INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_group_results_group
  ON group_results(group_id, played_at DESC);
`;

export function openDb(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(MIGRATIONS);
  return db;
}
