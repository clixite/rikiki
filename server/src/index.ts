import { loadConfig } from './config';
import { createApp } from './app';
import { createMailer } from './mail/mailer';

const config = loadConfig();

/**
 * `node server/dist/index.js --mail-test moi@exemple.fr`
 *
 * Envoie un e-mail de contrôle avec la configuration réelle du serveur, puis
 * s'arrête — sans ouvrir la base ni écouter sur le port. Volontairement réservé
 * à la ligne de commande : le diagnostic exige un accès au serveur, jamais une
 * route ouverte sur Internet.
 */
const mailTestFlag = process.argv.indexOf('--mail-test');
if (mailTestFlag !== -1) {
  const to = process.argv[mailTestFlag + 1];
  if (!to || !to.includes('@')) {
    console.error('Usage : node server/dist/index.js --mail-test votre@adresse.fr');
    process.exit(2);
  }
  const mailer = createMailer(config);
  if (!mailer.enabled) {
    console.error("[mail] aucun fournisseur actif : renseignez RESEND_API_KEY, BREVO_API_KEY ou SMTP_* (voir deploy/DEPLOY.md)");
    process.exit(1);
  }
  try {
    await mailer.sendMagicLink(to, `${config.PUBLIC_URL.replace(/\/$/, '')}/verify?t=test-de-configuration`);
    console.log(`[mail] e-mail de contrôle remis à ${mailer.provider} pour ${to}.`);
    console.log('       Le lien qu’il contient est factice : seule la réception compte.');
    console.log('       Rien dans la boîte de réception ? Regardez les indésirables, puis le journal du fournisseur.');
    process.exit(0);
  } catch (e) {
    console.error(`[mail] échec de l’envoi via ${mailer.provider} :`, e);
    process.exit(1);
  }
}

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
