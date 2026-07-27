import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { isBotId } from '@rikiki/shared';
import type { Config } from './config';
import { openDb } from './db/db';
import { UsersRepo } from './db/users.repo';
import { LiveRoomsRepo } from './db/rooms.repo';
import { GroupsRepo } from './db/groups.repo';
import { authRoutes } from './auth/routes';
import { groupRoutes } from './groups/routes';
import { magicLinkRoutes } from './auth/magicLink';
import { createMailer, type Mailer } from './mail/mailer';
import { RoomManager } from './rooms/RoomManager';
import { registerSocketHandlers } from './sockets/handlers';

export function createApp(config: Config, overrides: { mailer?: Mailer } = {}) {
  const db = openDb(config.DB_PATH);
  const users = new UsersRepo(db);
  const liveRooms = new LiveRoomsRepo(db);
  const groups = new GroupsRepo(db);
  const mailer = overrides.mailer ?? createMailer(config);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api', authRoutes(users, config));
  app.use('/api', groupRoutes(groups, users, config));
  app.use('/api', magicLinkRoutes(db, users, config, mailer));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: false },
  });

  const rooms = new RoomManager(
    io,
    (state, bestRounds) => {
      const maxScore = Math.max(...state.players.map((p) => p.totalScore));
      const ranked = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
      const standings = ranked.map((p) => ({ pseudo: p.pseudo, avatar: p.avatar, score: p.totalScore }));
      const playedAt = Date.now();

      // Les joueurs automatiques n'ont pas de compte : ni stats ni historique.
      const humans = state.players.filter((pl) => !isBotId(pl.id));
      for (const p of humans) {
        const won = p.totalScore === maxScore;
        users.recordGameResult(p.id, p.totalScore, won, bestRounds[p.id] ?? 0);
        users.addHistoryEntry({
          userId: p.id,
          code: state.code,
          playedAt,
          playersCount: state.players.length,
          myScore: p.totalScore,
          myRank: ranked.findIndex((r) => r.id === p.id) + 1,
          won,
          standings,
        });
      }

      // Partie rattachée à un groupe par l'hôte : on alimente son classement
      // cumulé (le repo ignore les non-membres, donc jamais les robots).
      if (state.groupId) {
        groups.recordGameResults(
          state.groupId,
          state.code,
          playedAt,
          humans.map((p) => ({
            userId: p.id,
            score: p.totalScore,
            rank: ranked.findIndex((r) => r.id === p.id) + 1,
            won: p.totalScore === maxScore,
          })),
        );
      }
    },
    { botDelayMs: config.BOT_DELAY_MS },
    // Les parties en cours sont persistées : elles survivent à un redémarrage.
    liveRooms,
  );
  registerSocketHandlers(io, rooms, users, config, groups);

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

  return { app, httpServer, io, rooms, db, users, liveRooms, groups };
}
