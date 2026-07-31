import { loadConfig } from './config';
import { createApp } from './app';

const config = loadConfig();
const { httpServer, rooms, db } = createApp(config);

httpServer.listen(config.PORT, () => {
  console.log(`[rikiki] serveur démarré sur le port ${config.PORT} (${config.NODE_ENV})`);
});

let shuttingDown = false;

function closeDb() {
  if (db.open) db.close();
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('[rikiki] arrêt en cours…');
  // Les parties en cours sont écrites en base AVANT la fermeture de celle-ci :
  // elles seront rechargées telles quelles au prochain démarrage.
  rooms.flushAll();
  rooms.stop();
  httpServer.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => {
    closeDb();
    process.exit(0);
  }, 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
