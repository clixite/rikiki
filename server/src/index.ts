import { loadConfig } from './config';
import { createApp } from './app';

const config = loadConfig();
const { httpServer, rooms, db } = createApp(config);

httpServer.listen(config.PORT, () => {
  console.log(`[rikiki] serveur démarré sur le port ${config.PORT} (${config.NODE_ENV})`);
});

function shutdown() {
  console.log('[rikiki] arrêt en cours…');
  rooms.stop();
  httpServer.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
