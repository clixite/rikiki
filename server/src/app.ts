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
import { authRoutes, bearerUserId } from './auth/routes';
import { groupRoutes } from './groups/routes';
import { magicLinkRoutes } from './auth/magicLink';
import { createMailer, type Mailer } from './mail/mailer';
import { PushRepo } from './db/push.repo';
import { SettingsRepo } from './db/settings.repo';
import { PushService, shouldNotifyTurn } from './push/PushService';
import { pushRoutes } from './push/routes';
import { createWebPushSender, type PushSender } from './push/sender';
import { resolveVapidKeys } from './push/vapid';
import { RoomManager } from './rooms/RoomManager';
import { registerSocketHandlers } from './sockets/handlers';

export function createApp(config: Config, overrides: { mailer?: Mailer; pushSender?: PushSender } = {}) {
  const db = openDb(config.DB_PATH);
  const users = new UsersRepo(db);
  const liveRooms = new LiveRoomsRepo(db);
  const groups = new GroupsRepo(db);
  const mailer = overrides.mailer ?? createMailer(config);

  // Notifications « c'est ton tour » : clés VAPID stables entre redémarrages.
  const vapid = resolveVapidKeys(new SettingsRepo(db), config);
  const push = new PushService(
    new PushRepo(db),
    overrides.pushSender ?? createWebPushSender(vapid),
    vapid.publicKey,
  );

  const app = express();
  app.disable('x-powered-by');
  // Les vignettes de profil arrivent en data URL : au-delà de la limite par
  // défaut d'Express (100 ko), la requête serait rejetée avant validation.
  app.use(express.json({ limit: '256kb' }));

  /**
   * Origines autorisées à appeler l'API.
   *
   * Sur le web, le client est servi par ce même serveur : aucune requête
   * croisée, donc rien à autoriser. L'application iOS, elle, embarque ses
   * fichiers et se présente sous `capacitor://localhost` — sans cet en-tête,
   * la WebView bloque tous les appels et l'application est inutilisable.
   */
  const NATIVE_ORIGINS = new Set(['capacitor://localhost', 'ionic://localhost', 'http://localhost']);
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && NATIVE_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    // Le déploiement (`install.sh`) et l'intégration continue s'en servent
    // comme feu vert : il doit donc dire la vérité. Renvoyer « ok » sans
    // toucher la base laissait passer un serveur qui répond mais dont le disque
    // est plein ou la base en lecture seule — exactement la panne qu'un
    // contrôle de santé est censé attraper. Une lecture triviale suffit à
    // prouver que la couche de données répond.
    try {
      db.prepare('SELECT 1').get();
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  /**
   * Erreurs remontées par le client.
   *
   * Journalisées, jamais stockées en base : ce sont des données de diagnostic,
   * pas des données utilisateur. Aucune authentification exigée — un plantage
   * survient précisément quand la session peut être cassée — mais la charge
   * utile est tronquée et le débit limité côté client.
   */
  app.post('/api/client-error', (req, res) => {
    const b = req.body as Record<string, unknown> | null;
    const cut = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
    console.error(
      '[client]',
      cut(b?.kind, 40),
      cut(b?.route, 60),
      cut(b?.version, 40),
      '|',
      cut(b?.message, 300),
      '|',
      cut(b?.userAgent, 120),
      cut(b?.stack, 800) ? '\n' + cut(b?.stack, 800) : '',
    );
    res.status(204).end();
  });
  app.use('/api', authRoutes(users, config));
  app.use('/api', groupRoutes(groups, users, config));
  app.use('/api', magicLinkRoutes(db, users, config, mailer));
  app.use('/api', pushRoutes(push, users, config));

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

      // Tout ou rien : stats, historique et classement de groupe partagent une
      // seule transaction. Sans elle, un arrêt brutal au milieu de la boucle
      // laissait certains joueurs avec des stats mises à jour mais pas leur
      // historique — ou une partie enregistrée pour trois joueurs sur cinq.
      db.transaction(() => {
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
      })();
    },
    {
      botDelayMs: config.BOT_DELAY_MS,
      // Un joueur devient le joueur attendu : on le prévient uniquement s'il
      // n'a plus aucun socket sur cette partie (application rangée / fermée).
      onTurn: (room, playerId) => {
        if (!shouldNotifyTurn(playerId, room.sockets.has(playerId))) return;
        const phase = room.state.phase === 'bidding' ? 'bidding' : 'playing';
        // Un échec d'envoi ne doit pas casser le tour, mais rester muet cachait
        // un fournisseur VAPID en panne — et l'expérience asynchrone repose sur
        // ces notifications. On journalise comme pour l'e-mail.
        push.notifyTurn(playerId, { code: room.code, phase }).catch((err) => {
          console.error('[push] échec notification de tour:', err);
        });
      },
    },
    // Les parties en cours sont persistées : elles survivent à un redémarrage.
    liveRooms,
  );
  registerSocketHandlers(io, rooms, users, config, groups);

  /**
   * Parties en cours du joueur.
   *
   * En temps réel, une seule partie à la fois : le client se souvient de son
   * code et propose de la reprendre. En asynchrone on en mène plusieurs de
   * front, sur plusieurs jours et depuis plusieurs appareils — la mémoire
   * locale ne suffit plus, c'est le serveur qui sait où on joue et laquelle
   * attend après nous.
   */
  app.get('/api/me/games', (req, res) => {
    const userId = bearerUserId(req.headers.authorization, config.JWT_SECRET);
    if (!userId || !users.getById(userId)) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session invalide.' });
      return;
    }
    res.json({ games: rooms.gamesOf(userId) });
  });

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

  return { app, httpServer, io, rooms, db, users, liveRooms, groups, push };
}
