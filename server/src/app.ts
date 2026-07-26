import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import type { Config } from './config';
import { openDb } from './db/db';
import { UsersRepo } from './db/users.repo';
import { authRoutes } from './auth/routes';
import { magicLinkRoutes } from './auth/magicLink';
import { createMailer, type Mailer } from './mail/mailer';
import { RoomManager } from './rooms/RoomManager';
import { registerSocketHandlers } from './sockets/handlers';

export function createApp(config: Config, overrides: { mailer?: Mailer } = {}) {
  const db = openDb(config.DB_PATH);
  const users = new UsersRepo(db);
  const mailer = overrides.mailer ?? createMailer(config);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api', authRoutes(users, config));
  app.use('/api', magicLinkRoutes(db, users, config, mailer));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: false },
  });

  const rooms = new RoomManager(io, (state, bestRounds) => {
    const maxScore = Math.max(...state.players.map((p) => p.totalScore));
    for (const p of state.players) {
      users.recordGameResult(p.id, p.totalScore, p.totalScore === maxScore, bestRounds[p.id] ?? 0);
    }
  });
  registerSocketHandlers(io, rooms, users, config);

  // En production, le serveur sert aussi le build du client (SPA)
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = [path.resolve(here, '../../client/dist'), path.resolve(here, '../client/dist')].find((p) =>
    fs.existsSync(path.join(p, 'index.html')),
  );
  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return { app, httpServer, io, rooms, db, users };
}
