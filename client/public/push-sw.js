/*
 * Gestionnaires Web Push du service worker.
 *
 * Ce fichier est importé par le service worker généré par Workbox
 * (option `workbox.importScripts` dans client/vite.config.ts) : le precache
 * reste entièrement géré par vite-plugin-pwa, on ne fait qu'ajouter les deux
 * écouteurs nécessaires aux notifications « c'est ton tour ».
 */

/* global self, clients */

const DEFAULT_TITLE = 'Rikiki 🃏';
const DEFAULT_BODY = "C'est à toi de jouer !";
const DEFAULT_URL = '/game';
const DEFAULT_TAG = 'rikiki-turn';

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Charge utile non JSON (ping d'un outil de test) : on garde les valeurs par défaut.
    payload = {};
  }

  const title = payload.title || DEFAULT_TITLE;
  const options = {
    body: payload.body || DEFAULT_BODY,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    lang: 'fr',
    // Le `tag` remplace l'avis précédent de la même partie au lieu de l'empiler.
    tag: payload.tag || DEFAULT_TAG,
    renotify: true,
    data: { url: payload.url || DEFAULT_URL },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    (async () => {
      const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      // On privilégie un onglet déjà ouvert sur le jeu : pas de doublon.
      const existing = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        if (typeof existing.navigate === 'function' && new URL(existing.url).pathname !== target) {
          await existing.navigate(target).catch(() => undefined);
        }
        return;
      }
      await clients.openWindow(target);
    })(),
  );
});
